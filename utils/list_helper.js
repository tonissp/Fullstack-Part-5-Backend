const _ = require("lodash")

const dummy = (blogs) => {
    return 1
  }

const totalLikes = (blogs) => {
	const blogsLikes = blogs.map(blogs => blogs.likes)

    const likes = blogsLikes.reduce((previousValue, currentValue) => previousValue + currentValue, 0)
  
	return likes
}

const favoriteBlog = (blogs) => {
	const blogsLikes = blogs.map(blogs => blogs.likes)
	const largestIndex = blogsLikes.indexOf(Math.max(...blogsLikes))
	const largestBlog = blogs[largestIndex]

	return {
		title: largestBlog.title,
		author: largestBlog.author,
		likes: largestBlog.likes,
	}
}

const mostBlogs = (blogs) => {
	const blogsAuthor = blogs.map(blogs => blogs.author)
	
    blogsAuthor.sort((a, b) => a - b); 
    let count = 1, 
        max = 0, 
        el; 
      
    for (let i = 1; i < blogsAuthor.length; ++i) { 
        if (blogsAuthor[i] === blogsAuthor[i - 1]) { 
            count++; 
        } else { 
            count = 1; 
        } 
        if (count > max) { 
            max = count; 
            el = blogsAuthor[i]; 
        } 
    } 
	
	return {
		author: el,
		blogs: count,
	}
}

const mostLikes = (blogs) => {
	const groupedBlogs = _.groupBy(blogs, 'author')
	const authorLikes = _.map(groupedBlogs, (arr) => { 
		return { 
			author: arr[0].author, 
			likes: _.sumBy(arr, 'likes'), 
		}; 
		
	})
	const maxLikesAuthor = _.maxBy(authorLikes, (a) => a.likes)

	return {
		author: maxLikesAuthor.author,
		likes: maxLikesAuthor.likes
	}
}
  
module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
  }