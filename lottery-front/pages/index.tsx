import { Box } from '@chakra-ui/react'
import type { NextPage } from 'next'
import HomePage from '../components/HomePage'
import { getAccountsPublicKeys } from '../lib/accounts'

interface IProps {
  publicKeys: string[]
}

const Home: NextPage<IProps> = ({ publicKeys }) => {
  return (
    <Box display="flex" flexDir="column" width="80%" margin="0 auto">
      <HomePage publicKeys={publicKeys} />
    </Box>
  )
}

export async function getStaticProps() {
  const publicKeys = await getAccountsPublicKeys()
  return {
    props: {
      publicKeys
    }
  }
}


export default Home
