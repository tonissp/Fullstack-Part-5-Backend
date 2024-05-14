const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.post('/', async (request, response) => {
    const { username, name, password } = request.body

    if (!password || !username) {
        return response.status(400).json({ error: 'password and username must be given' })
    } else if (password.length < 3 || username.length < 3) {
        return response.status(400).json({ error: 'password and username must be at least 3 characters long' })
    } else {
        try {
            const existingUser = await User.findOne({ username })

            if (existingUser) {
                return response.status(400).json({ error: 'Username is already taken' })
            }

            const saltRounds = 10
            const passwordHash = await bcrypt.hash(password, saltRounds)

            const user = new User({
                username,
                name,
                passwordHash,
            })

            const savedUser = await user.save()
            response.status(201).json(savedUser)
        } catch (error) {
            console.error('Error creating user:', error)
            return response.status(500).json({ error: 'Internal Server Error' })
        }
    }
})

usersRouter.get('/', async (request, response) => {
    try {
        const users = await User.find({}).populate('blogs')
        response.json(users)
    } catch (error) {
        console.error('Error fetching users:', error)
        response.status(500).json({ error: 'Internal Server Error' })
    }
})

module.exports = usersRouter