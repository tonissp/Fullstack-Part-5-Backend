const Blog = require('../models/blog')
const User = require('../models/user')

const initialUsers = [
  {
    username: "root",
    username: "idek",
    blogs: [ ],
    id: "65a5c247135471b11f3c22db"
  }
]

const initialBlogs = [
    {
    title: "eeg",
    author: "test",
    url: "no",
    likes: 5,
    id: "65a319b50d2011c1f3ee3c24",
    },
    {
    title: "eh",
    author: "test",
    url: "no",
    likes: 8,
    id: "65a31a7680d40c2f4f2a508a",
    },
    {
    title: "whu",
    author: "tes2t",
    url: "noo",
    likes: 9,
    id: "65a3ce8b4234e5eb5499d794",
    }
]

const nonExistingId = async () => {
  const blog = new Blog({ title: 'willremovethissoon' })
  await blog.save()
  await blog.deleteOne()

  return blog._id.toString()
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

module.exports = {
  initialBlogs, nonExistingId, blogsInDb, usersInDb
}