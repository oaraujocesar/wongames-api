module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', '8f4b6d7ef67e6a0efab35b6f478bf598'),
  },
});
