exports.run = {
   usage: ['response'],
   category: 'owner',
   async: async (m, {
      client,
      setting,
      Func
   }) => {
      try {
         setting.response = setting.response ? setting.response : []
         if (setting.response.length < 1) return client.reply(m.chat, Func.texted('bold', `🚩 Response empty.`), m)
         let text = setting.response.sort((a, b) => a._id.localeCompare(b._id)).map((v, i) => {
            if (i == 0) {
               return `┌  ◦  ${v._id}`
            } else if (i == setting.response.sort((a, b) => a._id.localeCompare(b._id)).length - 1) {
               return `└  ◦  ${v._id}`
            } else {
               return `│  ◦  ${v._id}`
            }
         }).join('\n')
         m.reply(text)
      } catch (e) {
         client.reply(m.chat, global.status.error, m)
      }
   },
   error: false,
   owner: true,
   cache: true,
   location: __filename
}