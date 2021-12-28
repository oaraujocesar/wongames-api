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

const getByName = async (name, entityName) => {
  const item = await strapi.services[entityName].find({ name });

  return item.length ? item[0] : null;
};

const create = async (name, entityName) => {
  const isRegistered = await getByName(name, entityName);

  if (!isRegistered) {
    strapi.services[entityName].create({
      name,
      slug: slugify(name, { lower: true }),
    });
  }
};

module.exports = {
  populate: async (params) => {
    const gogApiURL = `https://www.gog.com/games/ajax/filtered?mediaType=game&page=1&sort=popularity`;

    const {
      data: { products },
    } = await axios.get(gogApiURL);

    const publisher = products[3].publisher;
    const developer = products[3].developer;

    await create(publisher, "publisher");
    await create(developer, "developer");
  },
};
