# Task buddy – how to use the app

Help in the app (Settings → Help and manual) is built from this file with `tools/build-help.ps1` when English is chosen. Edit only here (Swedish: `MANUAL.md`).

## Get started
- Write down what is on your mind as a task. Then you can let go of the thought – the app keeps track of it.
- Tap + New task. An empty task opens at once – write a title (e.g. Fix the awning) and it is saved. Your templates are shown under the title.
- Every task has a title, a short description, a deadline (date and, if you like, a time), sub-goals and notes. Everything is saved as soon as you leave a field.

## Tasks
- The list shows open tasks with the nearest deadline first. Overdue deadlines are red, today's are purple. Tasks without a deadline come last.
- The red number on the Tasks tab shows how many are due today or overdue.
- Description: feel free to paste a longer text, e.g. a summary with phone numbers and prices. The box grows with the text.
- Deadline: pick a date. The time is optional. ✕ removes the deadline.
- Sub-goals: type and tap Add. Tick them off when done. The number in the list (e.g. 1/3) shows how many are done.
- Notes: write what happened, e.g. Called, got an appointment 18/11. It gets today's date and goes on top. You can edit a note right in its box.

## Calendar
- The Calendar tab shows one month at a time. Each task with a deadline is a dot in the task's colour on its day. Done tasks are an empty ring, overdue days have a red date.
- Tap a day to see the tasks due that day, and a task to open it. ◀ and ▶ change month, tap the month's name to go back to today.

## Colour
- Tap 🎨 (or the colour dot) at the top right of the task and pick a colour. ⊘ removes the colour.
- Write what the colour means in the box below the colours (e.g. Home), or under Settings → Tasks → Colours. It applies to every task with that colour and shows in the list and the filter.
- The list can be filtered by colour.

## Templates
- Templates work like the dishes in Fitness buddy. For a task that comes back, tap Save as template at the bottom of the task. Title, description and sub-goals are saved.
- Your templates are under + New task. Tap one to start a new task with the description and sub-goals filled in. If you have typed a title it is used, otherwise the template's.
- Saving a template with the same title as an existing one replaces it.
- Rename or remove templates under Settings → Tasks → Templates.

## Done and archive
- When the task is solved: tap ✓ Done. It moves to Archive. Undo is available right after.
- When you tick the last sub-goal, the app offers to mark the task done (Mark done).
- At the top of Tasks you see how many tasks are overdue and how many are due today.
- In Archive you can search titles, descriptions, sub-goals and notes, and reopen a task with Reopen (Undo is available).
- Remove moves the task to the Trash (Settings → Tasks → Trash). There you can restore it or delete it for good. You choose how long tasks stay before they are deleted automatically.

## People
- Add people under Settings → Tasks → People. Then you can choose who does a task and filter the list by person.
- Removing a person removes it from every task. Undo is available right after.

## Earlier version
- The app was rebuilt on 2026-11-22. Types, categories and fields are gone. Your old threads are still here as tasks: filled-in fields are now lines in the description, and a date that was an end date or deadline became the task's deadline.

## Back
- Back closes what is open (a task, New task, the trash or a dialog) and then goes back through the tabs you visited. The app closes only where you started.

## Why your data is safe here
- This app holds what is on your mind: tasks, contacts and who in the family does what. That should not end up with a company, an advertiser or a hacker.
- **No server to hack.** Most big leaks happen when a company's database with millions of users' data is hacked. There is no such database here: your data is only in your phone. Anyone who wants it has to get into your particular phone.
- **Nothing to sell.** Many free apps – and paid ones too – make money from your data or share it with partners for ads and analytics. This app has no account, no analytics, no ads and no trackers. The browser also technically blocks every request out, so the data cannot be sent anywhere, not even by mistake.
- **Locked backup.** The backup file is encrypted with AES-256 and your password. If you put it in the cloud, the cloud service only sees unreadable data.
- **Open code.** All the code is public on GitHub and can be reviewed by anyone.
- **Honestly: nothing is 100 % safe.** What remains is your own phone – lock it with a code and keep it updated – a weak backup password, and that the app's code on GitHub Pages is not changed by someone unauthorised. But for this kind of data there is no safer practical way than never letting it leave the phone.

## Language
- The app starts in Swedish. Change the language under Settings → General → Language. Your data is the same in both languages; what you write yourself is not translated.

## Backup and moving
- Under Settings → General → Data: tap Save backup file. The file is always encrypted with a password – your code, which the app creates for you.
- To restore: tap Restore backup file, check the summary and tap Replace. All current data is replaced – Undo is available right afterwards.
- The app reminds you to back up every month (change under Data).
- Under Data you see how much storage the app uses. If it gets close to the limit (about 5 MB): save a backup file and delete old tasks.
- The backup file is always locked with **your code**: 16 random characters the app creates for you the first time it starts and stores on the device. If you would rather use your own code (e.g. the same in all your apps), tap **Choose your own code** – it needs at least 16 characters with upper and lower case, a digit and a special character, the same requirements as the created one. A backup takes one tap. Under Settings → Data you find Your code: **Show**, **Copy** and **New code**. Save the code in your password manager – on a new phone (or after Delete all data) you need it to open a backup. If you restore a backup with a different code, that code is used for new backups from then on. New code means old backup files open only with the old code (Undo is available). The app collects no data – the code is just a key that protects your backups.

## Install as an app

![Android: Chrome menu ⋮ → Install app](manual/install-android-en.png)
- **Android (Chrome):** open the app link, tap ⋮ at the top right and choose **Install app**.

![iPhone: Safari → Share → Add to Home Screen](manual/install-ios-en.png)
- **iPhone (Safari):** open the link in Safari, tap **Share** (the box with the arrow) and choose **Add to Home Screen** → **Add**.
- Installed, the app works like a normal app, even offline.

## Privacy
- The app makes no requests – no server, no analytics, no account. Everything you write is only on this phone.
