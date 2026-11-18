import { fireEvent, render, screen } from '@testing-library/react'
import UserPhoto from './UserPhoto'

describe('UserPhoto', () => {
  it('renders the photo from USOS', () => {
    render(
      <UserPhoto url="https://example.com/photo.jpg" className="h-40 w-32" />,
    )

    expect(
      screen.getByRole('img', { name: 'Zdjęcie profilowe' }),
    ).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })

  it('falls back when the photo URL expires', () => {
    render(
      <UserPhoto url="https://example.com/photo.jpg" className="h-40 w-32" />,
    )

    fireEvent.error(screen.getByRole('img', { name: 'Zdjęcie profilowe' }))

    expect(screen.getByText('Zdjęcie')).toBeInTheDocument()
    expect(
      screen.queryByRole('img', { name: 'Zdjęcie profilowe' }),
    ).not.toBeInTheDocument()
  })

  it('shows a placeholder without a photo', () => {
    render(<UserPhoto url={null} className="h-40 w-32" />)

    expect(screen.getByText('Zdjęcie')).toBeInTheDocument()
  })
})
