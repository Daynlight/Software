import { fireEvent, render, screen } from '@testing-library/react'
import ProfileForm from './ProfileForm'

const user = {
  firstName: 'Jan',
  lastName: 'Kowalski',
  indexNumber: '123456',
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
    expect(screen.getByText('Numer USOS')).toBeInTheDocument()
    expect(screen.getByText('123456')).toBeInTheDocument()
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
})
