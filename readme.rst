Bracket Tool
============

The big picture
---------------

This is a tool for creating user-voted competition brackets (e.g., what's your favorite Seattle park?). It's built on our `newsapp template <https://github.com/seattletimes/newsapp-template>`_, and uses the same underlying technology (NodeJS build system, publish to S3). Because it produces a static site, we leverage Google Sheets as the "server" and storage system for voting, periodically downloading and locking down results. This is not an ideal solution (it's insecure, relies on a fickle third party platform, and is relatively slow to respond to AJAX) but we live in an imperfect world that will one day devolve into a watery, malaria-prone wasteland of post-climate change savagery, so maybe you could keep some perspective, yeah?

Setup
-----

There are two parts to the setup for this project, remote and local. It's easiest to start with remote, which is largely standalone, and then set up the local side.

Remote setup
~~~~~~~~~~~~

There are three required elements for the Google Sheets part of a bracket app. It needs a sheet named `order` (which contains the sheet names and display titles for each round), a sheet called `candidates` with metadata about each bracket option, and a Google Apps script published as a web app to handle voting. You can set these up from scratch (the script is included in the repo as XXXX.gs), but I would recommend simply duplicating the sample bracket sheet `here <http://example.com>`_.

Once the workbook is created/duplicated, it must be published to the web, and the web app must be enabled. For the latter, open the script editor (Tools -> Script Editor) and choose Publish -> Deploy as Web App from the menu. Make sure to choose "new" from the project version dropdown menu. The script should be set to execute as "me" and available to "anyone, even anonymous." Once successful, the dialog box will give you a web app URL. Leave that open, and then start the local setup.

For each round, you'll need to have a separate sheet in the workbook, matching the IDs that are specified in the ``order`` sheet. I recommend calling these ``round1``, ``round2``, etc. You can specify a user-friendly title in the ordering sheet to be shown to readers, so the internal ID can be much simpler and easier for you to remember. Bracket pairings are created in each round by matching off the rows in groups of two, so that rows #2 and #3 are the first pairing, #4 and #5 are the second pairing, and so on.

Local setup
~~~~~~~~~~~

*blah blah blah, running the template for the first time*

In addition to the basic setup, your bracket needs to know how to talk to Google Sheets for data. In the ``project.json`` file, set the "sheets" property to contain the sheet ID, and the "endpoint" property to the URL that the published web app script gave you in the step above.

Opening a round
---------------

In order to generate the HTML for the bracket at any given time, you need to tell the build process which round of the bracket you're currently in. We do this with a command line flag, ``--round``, which specifies the sheet name of the round that's currently open for voting. For example, you might work on the third round of a typical bracket by starting the build like so::

    grunt --round=round3

This command line flag is compatible with any of the Grunt commands you may have used, including the ones that run and exit immediately (instead of running the dev server). For example, if we wanted to generate the HTML and immediately push it up to S3, we could use this code::

    grunt static publish:live --round=round3

In addition to generating the static HTML, we need to tell Google Sheets which round should have votes applied to it. We do this through the Google Apps Script configuration, because we don't want people to be able to vote on expired rounds (by accident or otherwise). Set the ``current`` variable in the apps script, and then use Publish -> Deploy as Web App in the Google Sheets menu to reset the server.

Closing a round
---------------

For the most part, you can run a bracket by hand, by creating new spreadsheets from the previous round's winners and then opening the new round as shown above. But it is often helpful, particularly in larger brackets, to just have the tool generate the sheet for the next round for you. You can use the ``close`` task to do so, passing in the just-finished round via the command line flag. For example, to close the third round and create a sheet for the fourth, you could run this command::

    grunt close --round=round3

The ``close`` task will actually open Excel (or whatever program you have associate with .csv) so that you can copy/paste into the new sheet.

When all rounds are closed, be sure to set the ``active`` variable in the web app script to ``false`` and republish it, so that nobody will be allowed to vote on this script again.