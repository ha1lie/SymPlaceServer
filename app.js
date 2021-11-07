const express = require('express')
const fs = require('fs-extra')
const parser = require('body-parser')
const app = express()
const port = 3000
const axios = require("axios").default

const userContainer = fs.readJSONSync('./safe-place-users.json')
const reviewContainer = fs.readJSONSync('./safe-place-reviews.json')

//Global
app.use('/static', express.static('files'))
app.use(parser.json())

function formatString(string) {
    let newstring = ""
    stringSplit = string.split(" ")
    for (str in stringSplit) {
        stri = stringSplit[str]
        if (stringSplit[str - 1] != undefined) newstring += " "
        newstring += stri.charAt(0).toUpperCase() + stri.slice(1).toLowerCase()
    }
    return newstring
}

async function getLocationFromCoords(longitude, latitude) {
    let state, country, city, lat, longt, streetNumber, streetAddress, name, postal
    try {
        const url = "https://geocode.xyz/" + longitude + "," + latitude + "?geoit=json&auth=479241597209718609340x31990"
        console.log(url)
        data = (await axios.request(url)).data
        postal = data.postal
        state = (data.poi.addr_state != undefined ? data.poi.addr_state : data.state)
        country = data.prov
        city = (data.poi.addr_city != undefined ? data.poi.addr_city : formatString(data.city))
        lat = latitude
        longt = longitude
        streetNumber = ""
        if (data.strnumber != undefined && data.strnumber != {} && data.strnumber != "[object Object]") streetNumber = `${data.strnumber} `
        streetAddress = (data.poi.name != undefined ? data.poi.name : `${streetNumber}${data.poi.addr_street}`)
        name = (data.poi.operator != undefined ? data.poi.operator : data.poi.name)
    } catch {
        return {
            status: 400,
            message: "An error occured"
        }
    }
    return {
        status: 200,
        message: "Request successfully handled",
        data: {
            coords: {
                lat: lat,
                longt: longt
            },
            state: state,
            country: country,
            city: city,
            zipcode: postal,
            street_address: streetAddress,
            full_address: `${streetAddress}, ${city} ${state} ${postal}`,
            name: name
        }
    }
}

async function getNameFromCoords(longitude, latitude) {
    let name
    try {
        const url = "https://geocode.xyz/" + longitude + "," + latitude + "?geoit=json&auth=479241597209718609340x31990"
        name = (data.poi.operator != undefined ? data.poi.operator : data.poi.name)
    } catch {
        return {
            status: 400,
            message: "An error occured"
        }
    }
    return {
        status: 200,
        message: "Request successfully handled",
        data: {
            name: name
        }
    }
}

function saveUserToDB(id, user) {
    console.log(userContainer)
    userContainer[id] = user
    fs.writeJSONSync('./safe-place-users.json', userContainer)
    console.log("SHOULD HAVE BEEN WRITTEN")
}

function saveReviewToDB(id, body) {
    reviewContainer[id] = body
    fs.writeJSONSync('./safe-place-reviews.json', reviewContainer)
    console.log("SHOULD HAVE BEEN WRITTEN")
}

function addLocationToDB(location) {
    print(location);
}

app.get("/", (req, res) => {
    console.log("PING")
    res.send("PONG");
})

app.get("/places/info/:long/:lat", async (req, res) => {
    console.log("REQUESTING A LOCATION")
    let rval = await getLocationFromCoords(req.params.lat, req.params.long)
    console.log(rval)
    res.status(rval.status).send(JSON.stringify(rval)).end()
})

app.get("/places/name/:long/:lat", async (req, res) => {
    console.log("REQUESTING A LOCATIONS NAME")
    let rval = await getNameFromCoords(req.params.lat, req.params.long)
    console.log(rval)
    res.status(rval.status).send(JSON.stringify(rval)).end()
})

app.get("/safe-place/locs", (req, res) => {
    //Returns a list of all safe spaces
    console.log("Making a new location")
    const location = SafePlace() //construct a new location
    addLocationToDB(location)
    res.send("YOYOYO THIS IS A SAFE PLACE")
});

app.get("/safe-place/send-notification", (req, res) => {

    try {
        sendNotification("9d0a158631c438cff63354cb227bd1c1698de09e8929b337eefbbd5b01708de1")
    } catch {
        return res.status(400).send(JSON.stringify({
            status: 400,
            message: "An error occured"
        })).end()
    }
    res.status(200).send(JSON.stringify({
        status: 200,
        message: "Notification sent"
    })).end()
});

app.post("/safe-place/new-user", (req, res) => {
    try {
        saveUserToDB(req.body.id, req.body)
    } catch {
        return res.status(400).send(JSON.stringify({
            status: 400,
            message: "An error occured"
        })).end()
    }
    res.status(200).send(JSON.stringify({
        status: 200,
        message: "User added to database"
    })).end()
})

app.post("/safe-places/new-review", (req, res) => {
    console.log("MAKING NEW REVIEW")
    console.log(req.body)
    try {
        saveReviewToDB(req.body.id, req.body)
    } catch {
        return res.status(400).send(JSON.stringify({
            status: 400,
            message: "An error occured"
        })).end()
    }
    res.status(200).send(JSON.stringify({
        status: 200,
        message: "Review added to database"
    })).end()
})

app.get("/safe-places/update-review/:id/:lgbtqPoints/:allieStaff/:bipocPoints/:visibility", (req, res) => {
    console.log("UPDATING THE ROUTE")
    let review = reviewContainer[req.params.id]
    let newCount = review.reviewCount + 1
    if (req.params.lgbtqPoints != undefined) {
        review.lgbtqPoints = (review.lgbtqPoints * (review.reviewCount / newCount)) + (req.params.lgbtqPoints * (1 / newCount))
    }
    if (req.params.allieStaff != undefined) {
        review.allieStaff = (review.allieStaff * (review.reviewCount / newCount)) + (req.params.allieStaff * (1 / newCount))
    }
    if (req.params.bipocPoints != undefined) {
        review.bipocPoints = (review.bipocPoints * (review.reviewCount / newCount)) + (req.params.bipocPoints * (1 / newCount))
    }
    if (req.params.visibility != undefined) {
        review.visibility = (review.visibility * (review.reviewCount / newCount)) + (req.params.visibility * (1 / newCount))
    }
    review.reviewCount = newCount
    reviewContainer[req.params.id] = review
    console.log(review)
    fs.writeJSONSync('./safe-place-reviews.json', reviewContainer)
    res.status(200).send(JSON.stringify({
        status: 200,
        message: "Successfully updated review"
    })).end()
})

app.get("/safe-places/get-in-range/:startLong/:endLong/:startLat/:endLat", (req, res) => {
    console.log("GETTING PLACES IN RANGE")
    let reviews = []
    for (review in reviewContainer) {
        rev = reviewContainer[review]
        if (rev.latitude >= req.params.startLat && rev.latitude <= req.params.endLat && rev.longitude >= req.params.startLong && rev.longitude <= req.params.endLong) reviews.push(rev) 
    }
    res.status(200).send(JSON.stringify({
        status: 200,
        message: "Successfully retrieved reviews in range",
        data: reviews
    })).end()
})

app.get("/safe-places/all-reviews", (req, res) => {
    let reviews = []
    for (review in reviewContainer) {
        reviews.push(reviewContainer[review])
    }
    res.status(200).send(JSON.stringify({
        status: 200,
        message: "Successfully retrieved all reviews",
        data: reviews
    })).end()
})


//App Management
app.listen(port, async () => {
    console.log(`---------\nLISTENING on port ${port}\n---------`)
})



//NOTIFICATIONS


var apn = require('apn')

var apnOptions = {
    token: {
        key: "./AUTHFILE.p8",
        keyId: "KEY_ID",
        teamId: "MY_TEAM_ID"
    },
    production: false
};

var apnProvider = new apn.Provider(apnOptions);

function sendNotification(deviceToken) {
    var note = new apn.Notification()
    note.expiry = Math.floor(Date.now() / 1000) + 3600
    note.sound = "ping.aiff"
    note.topic = "dev.halz.SymPlace"
    note.alert = "We think that you like this place" // Change the body line
    note.title = "SymPlace - Suggested Location"
    note.body = "THIS IS THE BODY"

    apnProvider.send(note, [deviceToken]).then( (result) => {
        console.log("SENT THE NOTIFICATION TO THE APPLE SERVER")
        console.log(result)
    })
}