import { fireEvent, render, screen } from '@testing-library/react'
import ProfileForm from './ProfileForm'

const user = {
  firstName: 'Jan',
  lastName: 'Kowalski',
  indexNumber: 'S12345',
  photoUrl: 'https://example.com/photo.jpg',
  about: '',
  skills: '',
}

function submit() {
  fireEvent.submit(
    screen.getByRole('button', { name: 'Zapisz profil' }).closest('form')!,
  )
}

describe('ProfileForm', () => {
  it('shows the user data and the empty editable fields', () => {
    render(<ProfileForm user={user} />)

    expect(screen.getByText('Jan')).toBeInTheDocument()
    expect(screen.getByText('Kowalski')).toBeInTheDocument()
    expect(screen.getByText('Numer albumu')).toBeInTheDocument()
    expect(screen.getByText('S12345')).toBeInTheDocument()
    expect(screen.queryByText('Numer USOS')).not.toBeInTheDocument()
    expect(screen.queryByText('123456')).not.toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Zdjęcie profilowe' }),
    ).toHaveAttribute('src', 'https://example.com/photo.jpg')
    expect(screen.getByLabelText('O mnie')).toHaveValue('')
    expect(screen.getByLabelText('Umiejętności')).toHaveValue('')
  })

  it('keeps edits in the form', () => {
    render(<ProfileForm user={user} />)

    fireEvent.change(screen.getByLabelText('O mnie'), {
      target: { value: 'Nowy opis' },
    })
    fireEvent.change(screen.getByLabelText('Umiejętności'), {
      target: { value: 'TypeScript, React' },
    })

    expect(screen.getByLabelText('O mnie')).toHaveValue('Nowy opis')
    expect(screen.getByLabelText('Umiejętności')).toHaveValue(
      'TypeScript, React',
    )
  })

  it('confirms a local save and resets the confirmation after an edit', () => {
    render(<ProfileForm user={user} />)

    submit()

    expect(screen.getByRole('status')).toHaveTextContent(
      'Dane nie zostały jeszcze wysłane na serwer (backend w przygotowaniu).',
    )

    fireEvent.change(screen.getByLabelText('O mnie'), {
      target: { value: 'Inny opis' },
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('links back to the dashboard', () => {
    render(<ProfileForm user={user} />)

    expect(screen.getByRole('link', { name: 'Anuluj' })).toHaveAttribute(
      'href',
      '/dashboard',
    )
  })

  it('shows a placeholder when the user has no photo', () => {
    render(<ProfileForm user={{ ...user, photoUrl: null }} />)

    expect(screen.getByText('Zdjęcie')).toBeInTheDocument()
    expect(
      screen.queryByRole('img', { name: 'Zdjęcie profilowe' }),
    ).not.toBeInTheDocument()
  })
})
