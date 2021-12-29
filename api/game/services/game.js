"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const axios = require("axios");
const jsDOM = require("jsdom");
const slugify = require("slugify");
const FormData = require("form-data");

const timeout = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

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

const createGame = async (product) => {
  return await strapi.services.game.create({
    name: product.title,
    slug: product.slug.replace(/_/g, "-"),
    price: product.price.amount,
    release_date: new Date(
      Number(product.globalReleaseDate) * 1000
    ).toISOString(),
    categories: await Promise.all(
      product.genres.map((name) => getByName(name, "category"))
    ),
    platforms: await Promise.all(
      product.supportedOperatingSystems.map((name) =>
        getByName(name, "platform")
      )
    ),
    developers: [await getByName(product.developer, "developer")],
    publisher: await getByName(product.publisher, "publisher"),
    ...(await getGameInfo(product.slug)),
  });
};

const setImage = async ({ image, game, field = "cover" }) => {
  const URL = `https:${image}_bg_crop_1680x655.jpg`,
    { data } = await axios.get(URL, { responseType: "arraybuffer" }),
    buffer = Buffer.from(data, "base64");

  const formData = new FormData();

  formData.append("refId", game.id);
  formData.append("ref", "game");
  formData.append("field", field);
  formData.append("files", buffer, { filename: `${game.slug}.jpg` });

  console.info(`Uploading ${field} image: ${game.slug}.jpg`);

  await axios({
    method: "POST",
    url: `http://${strapi.config.host}:${strapi.config.port}/upload`,
    data: formData,
    headers: {
      "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
    },
  });
};

const createGames = async (products) => {
  await Promise.all(
    products.map(async (product) => {
      const isRegistered = await getByName(product.title, "game");

      if (!isRegistered) {
        console.info(`Creating "${product.title}"...`);

        const game = await createGame(product);

        await setImage({ image: product.image, game });

        await Promise.all(
          product.gallery
            .slice(0, 5)
            .map((url) => setImage({ image: url, game, field: "gallery" }))
        );

        await timeout(1500);

        return game;
      }
    })
  );
};

module.exports = {
  populate: async (params) => {
    const gogApiURL = `https://www.gog.com/games/ajax/filtered?mediaType=game&page=1&sort=popularity`;

    const {
      data: { products },
    } = await axios.get(gogApiURL);

    await createManyToManyData([products[4], products[5]]);
    await createGames([products[4], products[5]]);
  },
};
