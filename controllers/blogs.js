const blogsRouter = require('express').Router()
const Blog = require('../models/blog')  
const User = require('../models/user')
const jwt = require('jsonwebtoken')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({}).populate('user', 'username name id')
    response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
  const body = request.body

  try {
    const decodedToken = jwt.verify(request.token, process.env.SECRET)
    const user = await User.findById(decodedToken.id)
    if (!user) {
      return response.status(404).json({ error: 'User not found' })
    }
    
    if (!body.title || !body.url) {
      return response.status(400).json({ error: 'Title and URL must be provided' })
    }

    const blog = new Blog({
      title: body.title,
      author: body.author || user.username,
      url: body.url,
      likes: body.likes || 0,
      user: user._id
    })

    const savedBlog = await blog.save()

    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    response.status(201).json(savedBlog)
  } catch (error) {
    console.error('Error creating blog:', error)
    if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ error: 'Token missing or invalid' })
    }
    response.status(500).json({ error: 'Internal Server Error' })
  }
})

  blogsRouter.delete('/:id', async (request, response) => {
    try {
        const decodedToken = jwt.verify(request.token, process.env.SECRET)
        if (!decodedToken.id) {
            return response.status(401).json({ error: 'Unauthorized: Token missing or invalid' })
        }

        const blogToDelete = await Blog.findById(request.params.id)
        if (!blogToDelete) {
            return response.status(404).json({ error: 'Blog not found' })
        }

        if (decodedToken.id !== blogToDelete.user.toString()) {
            return response.status(403).json({ error: 'Forbidden: You do not have permission to delete this blog' })
        }

        await Blog.findByIdAndRemove(request.params.id)
        response.status(204).end()
    } catch (error) {
        console.error('Error deleting blog:', error)
        response.status(500).json({ error: 'Internal Server Error' })
    }
})

blogsRouter.put('/:id', async (request, response) => {
    const body = request.body

    const blog = {
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes ? body.likes : 0,
    }

    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
    response.json(updatedBlog)
})

module.exports = blogsRouter