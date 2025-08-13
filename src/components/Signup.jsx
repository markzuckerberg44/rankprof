import React from 'react'
import { Link } from 'react-router-dom'

const Signup = () => {
  return (
    <div>
        <form className='max-w-md m-auto pt-24'>
            <h2 className='font-bold pb-2'>Signup</h2>
            <p>Ya tienes una cuenta? <Link to="/signin">Inicia sesión!</Link></p>
        </form>
    </div>
  )
}

export default Signup