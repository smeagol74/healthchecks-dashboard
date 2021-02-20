# healthchecks-dashboard

Customizable healthchecks.io dashboard inspired by the https://github.com/healthchecks/dashboard

Demo page can be found here: https://smeagol74.github.io/healthchecks-dashboard/sample.html

### Features

* **Autorefresh of the nodes state**. You may specify the `data-hc-refresh` data-attribute to start project autorefresh
  with desired period in seconds.
* **Clickable by-tag filter**. You may click on the tag in the project header and you will see only nodes with this tag
  specified. Click it one more time and filter will be removed.
* **Customizable look**. Just customize the look of the node with your own custom node template and your own CSS.

### Available configuration data-attributes:

* In `div` that will be the container for the project nodes
    * `data-hc-key` (mandatory) — API readonly key of the healthcheck project (https://healthchecks.io/docs/api/)
    * `data-hc-tag` (optional) — show only nodes with tag specified
    * `data-hc-host` (optional) — hostname of the healthcecks.io server (default 'healthchecks.io')
    * `data-hc-refresh` (optional) — if specified, this project nodes state will be autorefreshed every specified number
      of seconds (default to 5 seconds)
* In any `div` that will be condisered as the template for the nodes
    * `data-hc-template` (optional) — html template for the dashboard nodes

Check the `sample.html` for example.

### CSS customization:

Just grab the default `healthchecks-dashboard.css` file and configure it to your own design.