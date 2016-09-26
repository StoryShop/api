# StoryShop - The API

## Tests

End-to-end testing is powered in part by [BrowserStack](https://www.browserstack.com/), thanks to their support of Open Source projects.

## License

MIT

## App Repo

Though it is not a requirement in order to install & run the code in this backend `api` repo, there is a frontent `app` at [https://github.com/StoryShop/app](https://github.com/StoryShop/app), if one wants to spin up the _complete_ application.

## Installation

First you need to update your `/etc/hosts` file to include `dev.storyshopapp.com`, like so:

```
##
# Host Database
#
# localhost is used to configure the loopback interface
# when the system is booting.  Do not change this entry.
##
127.0.0.1       localhost dev.storyshopapp.com
255.255.255.255 broadcasthost
::1             localhost
```

Update the `fixtures/users.json` file to include yourself. Make sure you include a unique ID, an email address suitable for login with Google OAuth, and the `worlds` array with the ID of the example world.

You will also need to add your unique user ID to the `writers` array in `fixtures/worlds.json`.

Next, make sure MongoDB is running locally, and run the following commands to install dependencies & import all of our data fixtures:

```bash
$ npm install
$ npm run data
```

In order to have the api become fully-functional and properly connected to our cloud services, there are a number of environmental variables kept outside of the public repo in a file at `/run.sh`. Please contact an org admin to obtain the contents of this file.

With the above completed, the final step to run the back end is to execute the `/run.sh` script like so:

```bash
$ bash run.sh
```

The api can now be accessed through `dev.storyshopapp.com:9999`

## Contributing

Check out our [getting started guide](docs/getting_started_guide.md) to learn more.
