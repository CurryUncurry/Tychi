use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::*;

declare_id!("GaYLemFsWLURxRTLHhS735SdfYBuV3v2aJshrrTmvsmU");

#[program]
pub mod lottery {
    use super::*;

    pub fn initialize_lottery(ctx: Context<Initialize>, players_maximum: u32, ticket_price: u64, oracle_pubkey: Pubkey) -> Result<()> {
        let lottery: &mut Account<Lottery> = &mut ctx.accounts.lottery;        
        lottery.authority = ctx.accounts.admin.key();                
        lottery.players_amount = 0;  
        lottery.is_finished = false; 
        lottery.is_paid = false;           
        lottery.players_maximum = players_maximum;
        lottery.oracle = oracle_pubkey;
        lottery.ticket_price = ticket_price;

        Ok(())
    }

    pub fn join(ctx: Context<Join>) -> Result<()> {
        // Deserialise lottery account
        let lottery: &mut Account<Lottery> = &mut ctx.accounts.lottery;
        
        if lottery.players_amount == lottery.players_maximum {
            return Err(SErrors::LobbyIsFull.into());
        }

        let player: &mut Signer = &mut ctx.accounts.player;

        // player.to_account_info().lamports();
        // Transfer lamports to the lottery account
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &player.key(),
            &lottery.key(),
            lottery.ticket_price,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                player.to_account_info(),
                lottery.to_account_info(),
            ],
        )?;

        // Deserialise ticket account
        let ticket: &mut Account<Ticket> = &mut ctx.accounts.ticket;                

        ticket.is_active = true;
        // Set submitter field as the address pays for account creation
        ticket.submitter = ctx.accounts.player.key();

        // Set ticket index equal to the counter
        ticket.idx = lottery.players_amount;        

        // Increment total submissions counter
        lottery.players_amount += 1;                      

        Ok(())  
    }

     // Oracle picks winner index
     pub fn pick_winner(ctx: Context<Winner>) -> Result<()> {

        // Deserialise lottery account
        let lottery: &mut Account<Lottery> = &mut ctx.accounts.lottery;
        
        // Set winning index
        let random_number =  u64::try_from_slice(&hash(&(ctx.accounts.clock.unix_timestamp as i128 + ctx.accounts.clock.slot as i128).to_be_bytes()).to_bytes()[0..8]).unwrap();
        let winner: u32 = (random_number % lottery.players_amount as u64) as u32;
        lottery.winner_index = winner;
        lottery.is_finished = true;

        Ok(())
    }

    pub fn set_winner(ctx: Context<SetWinner>) -> Result<()> {
        let lottery: &mut Account<Lottery> = &mut ctx.accounts.lottery;
        let ticket: &mut Account<Ticket> = &mut ctx.accounts.ticket;                
        lottery.winner = ticket.submitter;
        Ok(())
    }
        
    pub fn pay_out_winner(ctx: Context<Payout>) -> Result<()> {

        // Check if it matches the winner address
        let lottery: &mut Account<Lottery> = &mut ctx.accounts.lottery;
        let recipient: &mut AccountInfo =  &mut ctx.accounts.winner;        

        // Get total money stored under original lottery account
        let balance: u64 = lottery.to_account_info().lamports();                      
        lottery.is_paid = true;
        **lottery.to_account_info().try_borrow_mut_lamports()? -= balance;
        **recipient.to_account_info().try_borrow_mut_lamports()? += balance; 
        
        Ok(())
    }


    pub fn leave(ctx: Context<Leave>) -> Result<()> {
        let lottery: &mut Account<Lottery> = &mut ctx.accounts.lottery;
        let recipient: &mut AccountInfo =  &mut ctx.accounts.player;

        // Get total money stored under original lottery account
        let balance: u64 = lottery.ticket_price;

        **lottery.to_account_info().try_borrow_mut_lamports()? -= balance;
        **recipient.to_account_info().try_borrow_mut_lamports()? += balance;
        // if lottery.winner == None {
        //     return Err(SErrors::GameFinished.into());
        // }

        let ticket: &mut Account<Ticket> =  &mut ctx.accounts.ticket;        

        lottery.players_amount -= 1;
        ticket.is_active = false;
        
        Ok(())
    }


}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = admin, space = 1000)]
    // , constraint = lottery.to_account_info().lamports == *lottery.players_maximum*2
    pub lottery: Account<'info, Lottery>,
    #[account(mut)]
    pub admin: Signer<'info>,    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Join<'info> {
    #[account(init, 
        seeds = [
            &lottery.players_amount.to_be_bytes(), 
            lottery.key().as_ref()
        ], 
        constraint = player.to_account_info().lamports() >= lottery.ticket_price,
        bump, 
        payer = player, 
        space=80
    )]
    pub ticket: Account<'info, Ticket>,        
    #[account(mut)]                            
    pub lottery: Account<'info, Lottery>,
    #[account(mut)]                                 
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,    
}

#[derive(Accounts)]
pub struct Winner<'info> {    
    #[account(mut, constraint = lottery.oracle == *oracle.key)]
    pub lottery: Account<'info, Lottery>,        
    pub oracle: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct SetWinner<'info> {    
    #[account(mut, constraint = lottery.winner_index == ticket.idx && lottery.is_finished == true)]
    pub lottery: Account<'info, Lottery>,        
    pub ticket: Account<'info, Ticket>,
}

#[derive(Accounts)]
pub struct Payout<'info> {             
    #[account(mut, 
        constraint = 
        ticket.submitter == *winner.key && 
        ticket.idx == lottery.winner_index &&
        lottery.is_paid == false
    )]       
    pub lottery: Account<'info, Lottery>,          // To assert winner and withdraw lamports
    #[account(mut)]
    /// CHECK: no check
    pub winner: AccountInfo<'info>,                // Winner account
    #[account(mut, constraint = ticket.is_active == true)]                  
    pub ticket: Account<'info, Ticket>,            // Winning PDA
}

#[derive(Accounts)]
pub struct Leave<'info> {             
    #[account(mut)]       
    pub lottery: Account<'info, Lottery>,          // To assert winner and withdraw lamports
    #[account(mut,
        constraint = 
        ticket.is_active == true &&
        ticket.submitter == *player.key
    )]                  
    pub ticket: Account<'info, Ticket>,
    #[account(mut)]
    /// CHECK:
    pub player: AccountInfo<'info>,
}


#[account]
pub struct Lottery {    
    pub is_finished: bool,
    pub is_paid: bool,
    pub authority: Pubkey, 
    pub oracle: Pubkey, 
    pub winner: Pubkey,
    pub winner_index: u32, 
    pub players_amount: u32,
    pub players_maximum: u32,
    pub ticket_price: u64,
}

#[account]
#[derive(Default)] 
pub struct Ticket {    
    pub submitter: Pubkey,    
    pub idx: u32,
    pub is_active: bool,
}

#[error_code]
pub enum SErrors {
    GameFinished,
    LobbyIsFull,
}
