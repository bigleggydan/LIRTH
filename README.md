**To update the master list for a new month**

Here is how you swap the old hunt for a new one:

1. Update the Master List
Go to your Firebase Console and open Firestore Database.

Navigate to the settings collection and the treasureHunt document.

Click on the items field.

You can either edit the existing items or delete them and add new ones (e.g., "Silver Compass", "Captain's Log", "Golden Key").

To reset Users Progress

When you start a new hunt, your users will still have their "ticks" from the old hunt saved in their userProgress document. To give everyone a fresh start, you have two options:

Option A: The Manual Wipe (For small groups)

Go to the userProgress collection in Firestore.

Delete the documents inside (or delete the whole collection).

The next time a user logs in, they will see the new list with all boxes unchecked.

Option B: The "Version" Trick (Professional Way)
If you don't want to delete data, you can change the document name the app looks for.

In Firestore, create a new document in settings called treasureHunt_March.

In your app.js, change this line:
const masterRef = doc(db, "settings", "treasureHunt");

**Adding the New Hunt**
Go to your Firestore Database.

Click on your settings collection (the first column).

Click Add document (the plus icon at the top of that column).

Document ID: Type treasureHunt_March (This is the unique name the app will look for).

Field: Type items.

Type: Change the dropdown from "string" to array.

Value: Start adding your new items (Value 0: "Silver Coin", Value 1: "Ancient Map", etc.).

Click Save.

Now you need to tell your code to stop looking at the old list and start looking at the March list. Open app.js and find this line inside displayTreasureList:

Change this:

JavaScript
const masterRef = doc(db, "settings", "treasureHunt");
To this:

JavaScript
const masterRef = doc(db, "settings", "treasureHunt_March");
to
const masterRef = doc(db, "settings", "treasureHunt_March");
