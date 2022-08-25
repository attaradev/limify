###############
# build stage #
###############
FROM node:14 as build
WORKDIR /build
COPY web/package.json web/yarn.lock ./
RUN yarn install
COPY web .
RUN yarn build


###############
# final stage #
###############
FROM node:14
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY web/package.json web/yarn.lock ./
RUN yarn install
# copy build files
COPY --from=build /build/dist dist
COPY --from=build /build/.next .next
EXPOSE 8081
RUN chown -R node /usr/src/app
USER node
CMD ["yarn", "start"]