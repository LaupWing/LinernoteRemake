const express = require('express')
const router  = express.Router()
const {spotifyApi} = require('./api.js')
const {instagram} = require('./api.js')
const {soundCloud} = require('./api.js')
let artistName   = null
const Youtube = require('youtube-node')

router.get('/', (req, res)=>{
    res.render('login')
})



router.get('/index', (req, res)=>{
    const io = req.app.get('socketio')
    io.on('connection', socket=>{
        socket.on('sending searchvalue',async (value)=>{
            const data  = await spotifyApi.search(value, req.session.acces_token)
            socket.emit('sending artistinfo', data.artists)            
        })
    })
    res.render('index',{
        currentPage: 'partials/following.ejs',
    })
})

router.get('/home', (req, res)=>{
    res.render('partials/following')
})

router.get('/search', (req, res)=>{
    res.render('partials/search.ejs')
})

router.get('/ms', async (req, res)=>{
    const data = await soundCloud('post malone')
    // console.log(data)
    res.send(data)
})

router.get('/artist/:id', async(req,res)=>{
    const id = req.params.id
    const acces_token = req.session.acces_token
    
    const artist     = await spotifyApi.artist(id, acces_token)
    const related    = await spotifyApi.related(id, acces_token)
    const topTracks  = await spotifyApi.topTracks(id, acces_token)
    artistName = artist.name
    res.render('partials/artist',{
        artist,
        related,
        topTracks
    })
})

router.get('/feed', async (req,res)=>{
    const insta      = await instagram(artistName)
    const soundcloud = await soundCloud(artistName)
    const yt = new Youtube()
    console.log(artistName, 'artist name')
    yt.setKey("AIzaSyBeiiNR-feYHP2uC90LKZWVFlGx7IQ9ztE")
    yt.search(artistName,10,(err,response) => {
        const youtube = null
        console.log(response)
        // const youtube = response.items
        // .filter(i=>i.id.videoId)
        // .map(i=>{
        //     return {
        //         id:i.id.videoId,
        //         date: i.snippet.publishedAt
        //     }
        // })
        res.render('partials/artist-partials/feeds',{
            youtube,
            insta,
            soundcloud
        })
    })

})


module.exports = router