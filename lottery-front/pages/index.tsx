import { Box } from '@chakra-ui/react'
import type { NextPage } from 'next'
import HomePage from '../components/HomePage'


const Home: NextPage = () => {
  return (
    <Box display="flex" flexDir="column" width="80%" margin="0 auto">
      <HomePage />
    </Box>
  )
}

export default Home
