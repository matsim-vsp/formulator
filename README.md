# formulator
VSP internal form tool.

### Adding new forms

If the forms ever need to be edited, their configurations are in `public/forms`. 

- The file `public/forms.txt` has the list of available forms
- Each form has a PNG image and YAML config associated with it.

### Building the site

Build with the command `npm run build`. This creates the built site in your local `dist` folder.

To push the built site to GitHub pages:

```bash
cd dist 
git init .
git remote add origin git@github.com:matsim-vsp/formulator.git
git push --force origin master:gh-pages
```
