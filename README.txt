SIR OYEDOT AI CREATOR — PROFILE PHOTO WEBSITE UPDATE
====================================================

This package uses the EXACT original portrait supplied in ChatGPT, unchanged.
The upload was a JPEG image with a .png filename, so the exact bytes have been
copied into assets/sir-oyedot-official-portrait.jpg (with the correct extension).
There are no edits, filters, retouching, or recompression.

WHAT IT WILL CHANGE
- Homepage: replaces the old decorative hero poster with the official portrait
  and a professional caption.
- About page: adds the same portrait above the existing personal story.
- Stylesheet: adds responsive photo presentation styles.
- Structured data: associates the portrait URL with the creator profile.
- Existing project/video links, CMS and portfolio copy remain intact.

INSTALL FROM A COMPUTER
1. Download/clone the GitHub repository:
   https://github.com/Siroyedotcreator/sir-oyedot-ai-creator
2. Extract this package somewhere accessible.
3. Open a terminal in your website repository folder.
4. Run the script using the path to the EXTRACTED package, e.g.:
   python3 /path/to/sir_oyedot_profile_photo_update/apply_profile_photo.py .
5. Check the homepage and About page in a browser.
6. Commit and push these 4 website files:
   index.html
   about.html
   assets/styles.css
   assets/sir-oyedot-official-portrait.jpg

If the repository is connected to Vercel, a push to the production branch
should trigger a redeployment; confirm successful status in Vercel.

NOTE FOR MOBILE USERS
GitHub's phone interface cannot run the Python integration script automatically.
You can still upload the photo to the repository's assets folder, but you must
then make the HTML/CSS changes using GitHub's web editor or run the integration
script in a coding environment (GitHub Codespaces, a computer, or Termux).
Do not upload this whole ZIP to the repository expecting it to modify the site.

LIMITATION
ChatGPT's connected GitHub integration returned 403 (read access works, write
access denied), so the site was not published automatically. The package does
not alter the live website until you integrate and deploy it.
