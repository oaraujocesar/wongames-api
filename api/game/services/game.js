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

const createManyToManyData = async (products) => {
  const developers = {},
    publishers = {},
    categories = {},
    platforms = {};

  products.forEach((product) => {
    const { developer, publisher, genres, supportedOperatingSystems } = product;

    genres?.forEach((item) => {
      categories[item] = true;
    });

    supportedOperatingSystems?.forEach((item) => {
      platforms[item] = true;
    });

    developers[developer] = true;
    publishers[publisher] = true;
  });

  return Promise.all([
    ...Object.keys(developers).map((name) => create(name, "developer")),
    ...Object.keys(publishers).map((name) => create(name, "publisher")),
    ...Object.keys(categories).map((name) => create(name, "category")),
    ...Object.keys(platforms).map((name) => create(name, "platform")),
  ]);
};

module.exports = {
  populate: async (params) => {
    const gogApiURL = `https://www.gog.com/games/ajax/filtered?mediaType=game&page=1&sort=popularity`;

    const {
      data: { products },
    } = await axios.get(gogApiURL);

    await createManyToManyData([products[4], products[5]])
  },
};
