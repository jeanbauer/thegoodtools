export type Tool = 'pencil' | 'eraser' | 'fill'

export interface ColorTheme {
  name: string
  colors: string[]
}

// Wes Anderson film palettes — carried over from the original app.
export const COLOR_THEMES: ColorTheme[] = [
  { name: 'Grand Budapest', colors: ['#F1BB7B', '#FD6467', '#5B1A18', '#D67236'] },
  { name: 'Moonrise 1', colors: ['#F3DF6C', '#CEAB07', '#D5D5D3', '#24281A'] },
  { name: 'Royal 1', colors: ['#899DA4', '#C93312', '#FAEFD1', '#DC863B'] },
  { name: 'Moonrise 2', colors: ['#798E87', '#C27D38', '#CCC591', '#29211F'] },
  { name: 'Cavalcanti', colors: ['#D8B70A', '#02401B', '#A2A475', '#81A88D'] },
  { name: 'Royal 2', colors: ['#9A8822', '#F5CDB4', '#F8AFA8', '#FDDDA0'] },
  { name: 'Grand Budapest 2', colors: ['#E6A0C4', '#C6CDF7', '#D8A499', '#7294D4'] },
  { name: 'Moonrise 3', colors: ['#85D4E3', '#F4B5BD', '#9C964A', '#CDC08C'] },
  { name: 'Chevalier', colors: ['#446455', '#FDD262', '#D3DDDC', '#C7B19C'] },
  { name: 'Zissou', colors: ['#3B9AB2', '#78B7C5', '#EBCC2A', '#E1AF00'] },
  { name: 'Fantastic Fox', colors: ['#DD8D29', '#E2D200', '#46ACC8', '#E58601'] },
  { name: 'Darjeeling', colors: ['#FF0000', '#00A08A', '#F2AD00', '#F98400'] },
  { name: 'Rushmore', colors: ['#E1BD6D', '#EABE94', '#0B775E', '#35274A'] },
  { name: 'Bottle Rocket', colors: ['#A42820', '#5F5647', '#9B110E', '#3F5151'] },
  { name: 'Darjeeling 2', colors: ['#ECCBAE', '#046C9A', '#D69C4E', '#ABDDDE'] },
]
