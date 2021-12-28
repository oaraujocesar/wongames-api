"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const axios = require("axios");
const jsDOM = require("jsdom");
const slugify = require("slugify");

const getGameInfo = async (slug) => {
  const { JSDOM } = jsDOM,
    { data } = await axios.get(`https://www.gog.com/game/${slug}`),
    dom = new JSDOM(data);

  const description = dom.window.document.querySelector(".description");

  return {
    rating: "BR0",
    short_description: description.textContent.slice(0, 160),
    description: description.innerHTML,
  };
};

module.exports = {
  populate: async (params) => {
    const gogApiURL = `https://www.gog.com/games/ajax/filtered?mediaType=game&page=1&sort=popularity`;

    const {
      data: { products },
    } = await axios.get(gogApiURL);

    const publisher = products[0].publisher;
    const developer = products[0].developer;

    strapi.services.publisher.create({
      name: publisher,
      slug: slugify(publisher).toLowerCase(),
    });

    strapi.services.developer.create({
      name: developer,
      slug: slugify(developer).toLowerCase(),
    });

    console.log(await getGameInfo(products[0].slug));
  },
};
