const express       = require('express')
const router        = express.Router()
const {spotifyApi}  = require('./api.js')
const {instagram}   = require('./api.js')
const {soundCloud}  = require('./api.js')
const {wikipedia}   = require('./api.js')
let following
let acces_token 
let artistName      = null
const Youtube       = require('youtube-node')

router.get('/', (req, res)=>{
    res.render('login', {
        script:false
    })
})

async function getFollowerInfo(list){
    const following = list.map(async (a)=>{
        const artist      = await spotifyApi.artist(a.id, acces_token)
        return artist
    })
    const response   = await Promise.all(following)
    const reformList = response.map(item=>{
        return{
            name:   item.name,
            id:     item.id,
            image:  item.images[0].url
        }
    })
    console.log(reformList)
    return reformList 
}

function followedFirst(a,b){
    for(let f of following){
        if(a.id === f.id)      return 1
        else if(b.id === f.id) return 1
        else                   return -1
    }
}

router.get('/index', (req, res)=>{
    acces_token = req.session.acces_token
    const io = req.app.get('socketio')
    io.on('connection', socket=>{
        socket.on('sending searchvalue',async (value)=>{
            // console.log('requesting artist query')
            const data  = await spotifyApi.search(value, req.session.acces_token)
            // console.log(data.artists.items.sort(followedFirst))
            socket.emit('sending artistinfo', data.artists)            
        })
        socket.on('getArtistInfo', async (id)=>{
            const acces_token = req.session.acces_token
            const artist      = await spotifyApi.artist(id, acces_token)
            const related     = await spotifyApi.related(id, acces_token)
            const topTracks   = await spotifyApi.topTracks(id, acces_token)
            console.log(artist)
            const artistClean  = {
                image:  artist.images[0].url,
                id:     artist.id,
                name:   artist.name
            }
            const relatedClean = related.artists.map(artist=>{
                return{
                    image:  artist.images[0].url,
                    id:     artist.id,
                    name:   artist.name
                }
            })
            socket.emit('change artistpage',{
                artistClean,
                relatedClean,
                topTracks
            })
        })
        socket.on('list', async list=>{
            try{
                const results = await getFollowerInfo(list)
                following = results
                socket.emit('followers info', results)
            }catch{
                console.log('something went wrong with the following list')
            }
        })
        socket.on('register list', async list=>{
            try{
                const results = await getFollowerInfo(list)
                following = results
            }catch{
                console.log('something went wrong with the following list')
            }
        })
    })
    res.render('index',{
        currentPage: 'partials/following.ejs',
        script: true
    })
})

router.get('/home', async (req, res)=>{
    if(following !== undefined){
        const list = following
        res.render('partials/followingList', {list})
    }else{
        console.log('list is niet aanwezig')
        res.render('partials/following')
    }
})

router.get('/search', (req, res)=>{
    res.render('partials/search.ejs')
})

router.get('/testingdata', async (req, res)=>{
    const data = await wikipedia('anouk')
    console.log(data)
    res.send(data)
})

router.get('/artist/:id', async(req,res)=>{
    const id          = req.params.id
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
    const yt         = new Youtube()
    yt.setKey("AIzaSyBeiiNR-feYHP2uC90LKZWVFlGx7IQ9ztE")
    yt.search(artistName,10,(err,response) => {
        try{
            const youtube = response.items
            .filter(i=>i.id.videoId)
            .map(i=>{
                return {
                    id:i.id.videoId,
                    date: i.snippet.publishedAt
                }
            })
            res.render('partials/artist-partials/feeds',{
                youtube,
                insta,
                soundcloud
            })
        }catch{
            console.log(err)
            res.render('partials/artist-partials/feeds',{
                insta,
                soundcloud,
                youtube: null
            })
        }
    })

})

router.post('/testing', async(req,res)=>{
    console.log(req.body)
    res.send('index')
})


module.exports = router