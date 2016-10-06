# StoryShop - The API

## Tests

End-to-end testing is powered in part by [BrowserStack](https://www.browserstack.com/), thanks to their support of Open Source projects.

## License

MIT

## App Repo

Though it is not a requirement in order to install & run the code in this backend `api` repo, there is a frontent `app` at [https://github.com/StoryShop/app](https://github.com/StoryShop/app), if one wants to spin up the _complete_ application.

## Installation

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
or
```bash
$ sh run.sh
```
or
```bash
$ ./run.sh
```

The api can now be accessed through port `9999`

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md).

One key point is that we would prefer all Pull Requests be submitted from branches on our main `StoryShop` repos, rather than from engineers' forks, so that we are in a better position to expedite review & approval by making small corrections if need be. If you are not already a member of the org, please let us know if you would like to be granted write access for the purpose of submitting a PR.