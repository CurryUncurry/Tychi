import { extendTheme, ThemeConfig } from '@chakra-ui/react'

const theme: ThemeConfig = extendTheme({
	fonts: {
		body: 'Rubick, sans-serif',
		heading: 'Rubick, sans-serif'
	},
	initialColorMode: 'dark',
	useSystemColorMode: true,
})

export default theme
