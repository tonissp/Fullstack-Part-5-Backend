const supertest = require('supertest')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const User = require('../models/user')
const assert = require('node:assert')

const generateToken = async () => {
  const user = await User.findOne({})
  return jwt.sign({ username: user.username, id: user._id }, process.env.SECRET)
}

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
})

describe('when there is initially some blogs saved', () => {

  test('blogs are returned as json', async () => {
    const response = await api.get('/api/blogs')
    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.type, 'application/json')
  })

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')
    assert.strictEqual(response.body.length, helper.initialBlogs.length)
  })
})

describe('unique identifier property of blog posts', () => {
  test('the property is named id', async () => {
    const response = await api.get('/api/blogs')
    const blog = response.body[0]
    assert.strictEqual(typeof blog.id, 'string')
  })
})

describe('adding blogs to database', () => {
  test('a valid blog can be added ', async () => {
    const token = await generateToken()
    const newBlog = {
        title: 'Type wars',
        author: 'Robert C. Martin',
        url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
        likes: 2
    }  
  
    const response = await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)

    assert.strictEqual(response.status, 201)
  
    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)
  
    const contents = blogsAtEnd.map(n => n.title)
    assert(contents.includes('Type wars'))
  })

  test('new blog without likes property will be set to 0', async () => {
    const token = await generateToken()
    const newBlog = {
        title: 'Type wars',
        author: 'Robert C. Martin',
        url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
    }  

    const response = await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
    
    assert.strictEqual(response.status, 201)

    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

    const lastBlog = blogsAtEnd[blogsAtEnd.length - 1]
    assert.strictEqual(lastBlog.likes, 0)
  })

  test('new blog without title property will not be added', async () => {
    const token = await generateToken()
    const newBlog = {
        author: 'Robert C. Martin',
        url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
    }  

    const response = await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
    
    assert.strictEqual(response.status, 400)

    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
  })

  test('new blog without url property will not be added', async () => {
    const token = await generateToken()
    const newBlog = {
        title: 'Type wars',
        author: 'Robert C. Martin',
    }  

    const response = await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
    
    assert.strictEqual(response.status, 400)

    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
  })

  test('adding a blog fails with 401 Unauthorized if token is not provided', async () => {
    const newBlog = {
      title: 'Type wars',
      author: 'Robert C. Martin',
      url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
      likes: 2
    }

    const response = await api
      .post('/api/blogs')
      .send(newBlog)

    assert.strictEqual(response.status, 401)
    assert.strictEqual(response.body.error, 'Token missing or invalid')
  })
})

describe('handling existing blogposts', () => {
  test('a blog can be deleted', async () => {
    const newUser = {
      username: 'testuser',
      password: 'testpassword',
    }
    await api.post('/api/users').send(newUser)
  
    const loginResponse = await api.post('/api/login').send({
      username: newUser.username,
      password: newUser.password,
    })
    const token = loginResponse.body.token
  
    const newBlog = {
      title: 'Test Blog',
      author: 'Test Author',
      url: 'http://testurl.com',
      likes: 5,
    }
    const addBlogResponse = await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
    const addedBlogId = addBlogResponse.body.id

    const blogAdded = await helper.blogsInDb()
    assert.strictEqual(blogAdded.length, helper.initialBlogs.length+1)

    const deleteResponse = await api
      .delete(`/api/blogs/${addedBlogId}`)
      .set('Authorization', `Bearer ${token}`)
  
    assert.strictEqual(deleteResponse.status, 204)
  
    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    const titles = blogsAtEnd.map((blog) => blog.title)
    assert.ok(!titles.includes(newBlog.title))
  })

  test('the information of an existing blog post is updated', async () => {
    const blogsAtStart = await helper.blogsInDb()

    const blogToView = blogsAtStart[0]

    const newBlog = {
      title: blogsAtStart[0].title,
      author: blogsAtStart[0].author,
      url: blogsAtStart[0].url,
      likes: 42069
    }

    const response = await api    
      .put(`/api/blogs/${blogToView.id}`)  
      .send(newBlog)  

    assert.strictEqual(response.status, 200)

    const blogsAtEnd = await helper.blogsInDb()
    
    assert.strictEqual(
      blogsAtEnd.length, helper.initialBlogs.length
    )

    const beforeLikes = blogsAtStart.map(n => n.likes)
    
    const afterLikes = blogsAtEnd.map(n => n.likes)
    
    assert.deepStrictEqual(
      afterLikes.includes(beforeLikes), false
    )

    assert.deepStrictEqual(
      afterLikes[0], 42069
    )
  })
})

describe('when there is initially one user in db', () => {

  beforeEach(async () => {
    await User.deleteMany({})
  
    const passwordHash = await bcrypt.hash('secret', 10)
    const user = new User({ username: 'root', name: 'Root User', passwordHash })
  
    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
          username: 'hello',
          name: 'test',
          password: 'world'
      }

      const response = await api
          .post('/api/users')
          .send(newUser)

      assert.strictEqual(response.status, 201)
      
      const usersAtEnd = await helper.usersInDb()
      assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)
      
      const usernames = usersAtEnd.map(u => u.username)
      assert.ok(usernames.includes(newUser.username))
  })

  test('creation fails with proper statuscode and message if username does not exist', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
        name: 'test',
        password: 'world',
    }

    const result = await api 
        .post('/api/users')
        .send(newUser)

    assert.strictEqual(result.status, 400)

    assert.strictEqual(result.body.error, 'password and username must be given')

    const usersAtEnd = await helper.usersInDb()
    assert.deepStrictEqual(usersAtEnd, usersAtStart)
  })

  test('creation fails with proper statuscode and message if password does not exist', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
        name: 'damn',
        username: 'idk',
    }

    const result = await api 
        .post('/api/users')
        .send(newUser)

    assert.strictEqual(result.status, 400)

    assert.strictEqual(result.body.error, 'password and username must be given')

    const usersAtEnd = await helper.usersInDb()
    assert.deepStrictEqual(usersAtEnd, usersAtStart)
  })

  
  test('creation fails with proper statuscode and message if username already taken', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
          username: 'root',
          name: 'wow',
          password: 'world',
      }

      const result = await api 
          .post('/api/users')
          .send(newUser)

      assert.strictEqual(result.status, 400)          
      
      assert.strictEqual(result.body.error, 'Username is already taken')

      const usersAtEnd = await helper.usersInDb()
      assert.deepStrictEqual(usersAtEnd, usersAtStart)
  })
  

  test('creation fails with proper statuscode and message if username is less than 3 characters', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
        username: 'ye',
        name: 'yep',
        password: 'yes',
    }

    const result = await api 
        .post('/api/users')
        .send(newUser)

    assert.strictEqual(result.status, 400)
    
    assert.strictEqual(result.body.error, 'password and username must be at least 3 characters long')

    const usersAtEnd = await helper.usersInDb()
    assert.deepStrictEqual(usersAtEnd, usersAtStart)
  })

  test('creation fails with proper statuscode and message if password is less than three characters', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
        username: 'dam',
        name: 'damm',
        password: 'da',
    }

    const result = await api 
        .post('/api/users')
        .send(newUser)

    assert.strictEqual(result.status, 400)
    
    assert.strictEqual(result.body.error, 'password and username must be at least 3 characters long')

    const usersAtEnd = await helper.usersInDb()
    assert.deepStrictEqual(usersAtEnd, usersAtStart)
  })

})

afterAll(async () => {
    await mongoose.connection.close()
})