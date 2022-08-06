import { Context, isInteger, segment } from 'koishi'

export const name = 'mowned'

const URL_BASE = 'https://mowned.com'
const URL_SEARCH = URL_BASE + '/api/phone/search?text='
const URL_IMAGE = URL_BASE + '/html/phones/big/'
const URL_USER = URL_BASE + '/api/showcase/'
const URL_AVATAR = 'https://www.gravatar.com/avatar/'

interface ModelInfo {
  name: string,
  year: number,
  likeCount: number,
  dislikeCount: number,
  search: string,
  image: string,
}

interface UserPhone {
  yearTo: number,
  yearFrom: number,
  stillOwn: boolean,
  color: string,
  phone: ModelInfo
}

interface UserResp {
  userPhones: UserPhone[],
  user: {
    "alias": string,
    "nickname": string,
    "gravatar": string,
    "fullName": string
  }
  success: boolean
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
    .example("mownded -u mahoo12138")
    .option("user", "-u <username:string> 查询指定用户的手机列表")
    .action(async ({ session, options }, model) => {
      if (options.user) {
        try {
          const { userPhones, user: userInfo } = await ctx.http
            .get<UserResp>(URL_USER + options.user)
          if (userPhones.length === 0) {
            return session.text("user-never-add-phones", [options.user])
          }
          const profile = segment.image(URL_AVATAR + userInfo.gravatar) + userInfo.fullName
          const phonesList = userPhones.map(({ yearFrom: from, yearTo: to, phone: { name } }) => ` ·${from}~${to === 0 ? session.text('mowned.now') :to}：${name}`)
          return profile + session.text("mowned.phones", phonesList)
        } catch (e){
          ctx.logger('mowned').warn(e)
          return session.text("mowned.user-not-exist", [options.user])
        }
      } else {
        const info = await ctx.http.get<Map<string, ModelInfo>>(URL_SEARCH + model).then(dataMap2Array)
        let models = info.map(item => item?.search), answer = "1", index = 1;
        if (info.length >= 2) {
          await session.send(session.text("mowned.models", Object.fromEntries(models.slice(0, 4).map((v, i) => [i + 1, v]))))
          answer = await session.prompt(30 * 1000)
          if (!answer) return
        } else {
          if (info.length == 0) return session.text('mowned.model-not-exist', [model])
        }
        index = +answer - 1
        if (!isInteger(index) || index < 0 || index >= 4) {
          return session.text('mowned.incorrect-index')
        }
        return segment.image(URL_IMAGE + info[index].image) + info[index].search
      }
    })
}
