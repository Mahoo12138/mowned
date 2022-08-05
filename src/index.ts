import { Argv, Context, isInteger, segment } from 'koishi'

export const name = 'mowned'

const URL_BASE = 'https://mowned.com'
const URL_SEARCH = URL_BASE + '/api/phone/search?text='
const URL_IMAGE = URL_BASE + '/html/phones/big/'
const URL_USER = URL_BASE + '/api/showcase/'

interface ModelInfo {
  name: string,
  year: number,
  likeCount: number,
  dislikeCount: number,
  search: string,
  image: string,
}

export function apply(ctx: Context) {

  ctx.i18n.define('zh', require('./locales/zh'))

  const dataMap2Array = (data: Map<string, ModelInfo>) => {
    const arr: ModelInfo[] = [];
    if (!data) return arr
    Object.keys(data).forEach(key => {
      if (key !== "success" && key !== "uid") {
        arr.push(data[key])
      }
    })
    return arr
  }


  ctx.command('mowned <model>', '搜索手机型号')
    .example("mownded 'Nokia 6230i'")
    .action(async ({ session, options }, model) => {
      const info = await ctx.http.get<Map<string, ModelInfo>>(URL_SEARCH + model).then(dataMap2Array)
      let models = info.map(item => item?.search), answer = "1", index = 1;
      if (info.length >= 2) {
        
        await session.send(session.text("mowned.models", Object.fromEntries(models.slice(0, 4).map((v, i) => [i + 1, v]))))
        answer = await session.prompt(30 * 1000)
        if (!answer) return
      }else{
        if(info.length == 0) return session.text('mowned.model-not-exist', [model])
      }
      index = +answer - 1
      if (!isInteger(index) || index < 0 || index >= 4) {
        return session.text('mowned.incorrect-index')
      }
      return segment.image(URL_IMAGE + info[index].image)
    })
}
