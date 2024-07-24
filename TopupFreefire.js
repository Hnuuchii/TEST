const axios = require('axios');

class TopupFreefire {
  constructor(tokenAntirecaptcha = null) {
    this.tokenAntirecaptcha = tokenAntirecaptcha;
  }

  async loginFreefire(uid = null) {
    const recaptcha = await this.getTokenRecaptcha();
    let response = {};

    if (recaptcha.status === 'error') {
      response.status = 'error';
      response.message = 'recaptcha not work';
    } else {
      const result = await this.callAPI('POST', 'https://www.termgame.com/api/auth/player_id_login', {
        app_id: 100067,
        captcha_token: recaptcha.Token_Recaptcha,
        login_id: uid
      });

      if (result.error || !result.open_id || result.region !== 'TH') {
        response.status = 'error';
        response.message = 'uid not correct';
      } else {
        response.status = 'success';
        response.open_id = result.open_id;
        response.nickname = result.nickname;
      }
    }

    return response;
  }

  async topupGarenacard(open_id = null, garena_card = null) {
    const tokencaptcha = await this.getTokenCaptchaImage();
    let response = {};

    if (tokencaptcha.status !== 'success') {
      response.status = 'error';
      response.message = tokencaptcha.message;
    } else {
      const result = await this.callAPI('POST', 'https://www.termgame.com/api/shop/pay/init?language=th&region=IN.TH', {
        app_id: 100067,
        captcha: tokencaptcha.text,
        captcha_key: tokencaptcha.tokencaptcha,
        channel_data: {
          captcha: tokencaptcha.text,
          captchaKey: tokencaptcha.tokencaptcha,
          card_password: garena_card,
          friend_username: null
        },
        channel_id: 207000,
        open_id: open_id,
        packed_role_id: 0,
        service: 'pc'
      });

      if (result.result === 'success') {
        response.status = 'success';
        response.display_id = result.display_id;
      } else {
        response.status = 'error';
        response.message = result.result;
        response.display_id = result.display_id;
      }
    }

    return response;
  }

  async getTokenRecaptcha() {
    console.log("Starting getTokenRecaptcha...");
  
    const createTaskId = await this.callAPI('POST', 'https://api.anti-captcha.com/createTask', {
      clientKey: this.tokenAntirecaptcha,
      task: {
        websiteURL: 'https://discord.com/api/v9/auth/login',
        websiteKey: error.response.data.captcha_sitekey,
        websiteSToken: null,
        recaptchaDataSValue: null,
        type: 'NoCaptchaTaskProxyless'
      },
      softId: 802
    });
  
    console.log("createTaskId response:", createTaskId);
  
    let response = {};
    if (!createTaskId.taskId) {
      response.status = 'error';
      response.message = "CAN'T CREATE TASKID";
    } else {
      let result;
      const taskId = createTaskId.taskId;
      do {
        result = await this.callAPI('POST', 'https://api.anti-captcha.com/getTaskResult', {
          clientKey: this.tokenAntirecaptcha,
          taskId: taskId
        });
  
        console.log("getTaskResult response:", result);
  
        await new Promise(resolve => setTimeout(resolve, 2000));
      } while (result.status === 'processing');
  
      if (!result.solution || !result.solution.gRecaptchaResponse) {
        response.status = 'error';
        response.message = "Invalid or missing gRecaptchaResponse";
      } else {
        response.status = 'success';
        response.Token_Recaptcha = result.solution.gRecaptchaResponse;
      }
    }
  
    return response;
  }
  

  async getTokenCaptchaImage() {
    const gentoken = `${this.generateRandomString(10)}-${this.generateRandomString(10)}-${this.generateRandomString(5)}-${this.generateRandomString(6)}-${this.generateRandomString(10)}`;
    const resultbase64 = Buffer.from(await axios.get(`https://gop.captcha.garena.com/image?key=${gentoken}`, { responseType: 'arraybuffer' }).then(response => response.data)).toString('base64');

    const createTaskId = await this.callAPI('POST', 'https://api.anti-captcha.com/createTask', {
      clientKey: this.tokenAntirecaptcha,
      task: {
        type: 'ImageToTextTask',
        body: resultbase64,
        phrase: false,
        case: false,
        numeric: false,
        math: 0,
        minLength: 0,
        maxLength: 0
      }
    });

    let response = {};
    if (!createTaskId.taskId) {
      response.status = 'error';
      response.message = "CAN'T CREATE TASKID";
    } else {
      let result;
      const taskId = createTaskId.taskId;
      do {
        result = await this.callAPI('POST', 'https://api.anti-captcha.com/getTaskResult', {
          clientKey: this.tokenAntirecaptcha,
          taskId: taskId
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
      } while (result.status === 'processing');

      if (!result.solution.text) {
        response.status = 'error';
        response.message = 'try again';
      } else {
        response.status = 'success';
        response.tokencaptcha = gentoken;
        response.text = result.solution.text;
      }
    }

    return response;
  }

  async callAPI(method, url, data) {
    try {
      const response = await axios({
        method: method,
        url: url,
        headers: { 'Content-Type': 'application/json' },
        data: data,
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      });
      return response.data;
    } catch (error) {
      console.error('API call error:', error.response ? error.response.data : error.message);
      throw new Error('Connection Failure');
    }
  }

  generateRandomString(length = 10) {
    const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let randomString = '';
    for (let i = 0; i < length; i++) {
      randomString += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return randomString;
  }
}

module.exports = TopupFreefire;
