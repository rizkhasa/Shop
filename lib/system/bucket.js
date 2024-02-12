const { MongoClient, GridFSBucket } = require('mongodb')

module.exports = class Bucket {
   action = ''
   
   createBucket = async () => {
      if (!process.env.DATABASE_URL) return
      const client = new MongoClient(process.env.DATABASE_URL)
      await client.connect()
      const database = client.db('storage')
      this.action = new GridFSBucket(database)
   }
}