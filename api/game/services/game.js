"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const axios = require("axios");

const getGameInfo = async (slug) => {
  const jsDOM = require("jsdom"),
    { JSDOM } = jsDOM,
    { data } = await axios.get(`https://www.gog.com/game/${slug}`),
    dom = new JSDOM(data);

    const description = dom.window.document.querySelector('.description')

    return {
      rating: 'BR0',
      short_description: description.textContent.slice(0, 160),
      description: description.innerHTML
    }
};

module.exports = {
  populate: async (params) => {
    const gogApiURL = `https://www.gog.com/games/ajax/filtered?mediaType=game&page=1&sort=popularity`;

    const {
      data: { products },
    } = await axios.get(gogApiURL);

    console.log(await getGameInfo(products[0].slug));
  },
};
