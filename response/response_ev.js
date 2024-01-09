exports.run = {
   async: async (m, {
      client,
      body,
      setting,
      Func
   }) => {
      try {
         if (body && typeof body === 'string') {
            setting.response = setting.response ? setting.response : []
            const response = setting.response.find(v => v._id === body.toLowerCase())
            if (response) response.mediaUrl ? client.sendFile(m.chat, response.mediaUrl, '', response.response, m) : m.reply(response.response)
         }
      } catch (e) {
         console.log(e)
         return client.reply(m.chat, Func.jsonFormat(e), m)
      }
   },
   error: false,
   cache: true,
   location: __filename
}