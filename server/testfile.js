// const advisoryLock = require('advisory-lock')


// // "postgres://typ:typ@127.0.0.1:5432/typ_development"
// // const cm = advisoryLock.default({
// // 	host: "127.0.0.1",
// //   user: "typ",
// //   database: "typ_development",
// //   password: "typ",
// // })

// const cm = advisoryLock.default("postgres://typ:typ@127.0.0.1:5432/typ_development")
// async function run() {
// 	console.log("1")
// 	await cm('hi').withLock(() => console.log('hi'))
// 	console.log('all done')
// }

// run().then(() => console.log("ALL DONE"))
// // var _pg = require('pg');

// // var client = new _pg.Client("postgres://typ:typ@127.0.0.1:5432/typ_development");
// // client.connect((error) => {
// // 	console.log("done connect!", error)
// // })

// setTimeout(() => console.log("BOOM"), 60000)

const Redis = require("ioredis")

const f = async () => {
	const redis = new Redis()	
	setTimeout(async () => {
		redis.disconnect()
	}, 1000)
	console.log("about to pop")
	try {
		await redis.blpop("hey", 10)
		console.log("done pop")
	} catch (e) {
		console.log("error", e)
	}
	console.log("done with that")
}

f()