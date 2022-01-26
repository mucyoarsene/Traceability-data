const Koa = require('koa');
const koaBodyparser = require('koa-bodyparser');
const KoaRouter = require('koa-router');
const json = require('koa-json');
const data = require('./data');
const moment = require('moment');

const app = new Koa();
const router = new KoaRouter();
const port = process.env.PORT || 2000
const users = []; 


router.get('/hello', ctx => {
  ctx.body = {
    message: 'hello api'
};
ctx.status = 200;
});

router.post('/checkcollection', ctx => {
  const {tag_number} = ctx.request.body;
  const collection = data.collection;

  const found = collection.filter(item => item['tag-number'] === tag_number);
  if (found.length > 1) {
    ctx.body = {
      message: `This tag number ${tag_number} has duplicates`,
      duplicates: found
    }
    ctx.status = 409 
  }
  else {
    ctx.body = {
      message: `This tag number ${tag_number} has no duplicates`
    }
  }
});

router.post('/checkreception', ctx => {
  const {tag_number} = ctx.request.body;
  const reception = data.reception;

  const found = reception.filter(item => item['tag-number'] === tag_number);
  if (found.length > 1) {
    ctx.body = {
      message: `This tag number ${tag_number} has duplicates`,
      duplicates: found
    }
    ctx.status = 409 
  }
  else {
    ctx.body = {
      message: `This tag number ${tag_number} has no duplicates`
    }
  }
});

router.post('/checkprocessing', ctx => {
  const {tag_number} = ctx.request.body;
  const processing = data.processing;
  const collection = data.collection;
  const reception = data.reception;

  const found = processing.filter(item => item['tag-number'] === tag_number);
  const checkMissingCollection = collection.filter(item => item['tag-number'] === tag_number);
  const checkMissingReception = reception.filter(item => item['tag-number'] === tag_number); 

  if (found.length === 0) {
    return ctx.body = {
      message: `This ${tag_number} is not found`
    }
  }

  if (found.length > 1) {
    ctx.body = {
      message: `This tag number ${tag_number} has duplicates`,
      duplicates: found
    }
    ctx.status = 409 
  }
  else {
    if(checkMissingCollection.length === 0) {
      ctx.body = {
        message: `This tag number ${tag_number} is not recorded in collection step`
      }
      ctx.status = 200
    }
    else if(checkMissingReception.length ===0) {
      ctx.body = {
        message: `This tag number ${tag_number} is not recorded in reception step`
      }
      ctx.status = 200
    } else {
      ctx.body = {
        message: 'it has no problems'
      }
      ctx.status = 200
    }
  } 
});

router.post('/checkdates', ctx => {
  const collection = data.collection;
  const reception = data.reception;
  const processing = data.processing;

  const {tag_number} = ctx.request.body;
  
  const collectDate = collection.find(itm => itm['tag-number'] === tag_number)['recording-date'];
  const recieptDate = reception.find(itm => itm['tag-number'] === tag_number)['recording-date']; 
  const processDate = processing.find(itm => itm['tag-number'] === tag_number)['recording-date'];

  const firstDate = moment(new Date(collectDate)).add(1, 'days').format('M/D/YYYY');
  const secondDate = moment(new Date(recieptDate)).add(1, 'days').format('M/D/YYYY');
  

  if (firstDate === recieptDate && secondDate === processDate) {
    ctx.body = {
      message: 'yes, they are consecutive',
      dates: [collectDate, recieptDate, processDate]
    }
    ctx.status = 200;
  } else {
    ctx.body = {
      message: 'no, they are not consecutive',
      dates: [collectDate, recieptDate, processDate]
    }
    ctx.status = 409;
  }  
  
});

router.post('/check_percent', ctx => {
      const {tag_number} = ctx.request.body;
      const reception = data.reception;
      const processing = data.processing;

      const receptWeight = reception.find(itm => itm['tag-number'] === tag_number).weight;
      const processWeight = processing.find(itm => itm['tag-number'] === tag_number).weight;

      const difference = receptWeight - processWeight;
      const percentage = difference * 100/receptWeight;

      if (percentage < 5) {
        ctx.body = {
          message: `Weight loss  of ${tag_number} is below 5%`,
          percentage: `${percentage.toString().slice(0, 3)}%`
        }
      } else if(percentage > 10) {
        ctx.body = {
          message: `Weight loss of ${tag_number} is above 10%`,
          percentage: `${percentage.toString().slice(0, 3)}%`
        }
      } else{
        ctx.body = {
          message: 'These entries are inside the given margin'
        }
      }


});

app.use(koaBodyparser());
app.use(router.routes()).use(router.allowedMethods());
app.use(json());


app.listen(port, () => console.log(`Server started on http://localhost:${port} ...`));