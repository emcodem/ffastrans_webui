# FFAStrans Webinterface Styling - User Guide

## 🎨 What You Can Do

You can change how your FFAStrans webinterface looks by asking AI assistants (like Claude) to make styling changes for you. You don't need to know any programming - just describe what you want!

## 🚀 Getting Started

### Step 1: Open the Styling File
The AI assistant will work with this file:
```
override.css
```
**Note**: This is the ONLY file you can modify. All other files are packed inside the FFAStrans EXE and are inaccessible.

### Step 2: Ask the AI What You Want
Just describe the change in plain English. Examples:
- "Make the buttons blue"
- "Hide the preview column"
- "Make the text bigger"
- "Change the background color"

### Step 3: Test the Changes
1. Save the file when the AI tells you to
2. Refresh your browser (press Ctrl+F5)
3. See the changes!

## 💬 What to Ask the AI

### Color Changes
**What you can ask:**
- "Make the buttons blue"
- "Change the header color to green"
- "Make the background dark gray"
- "Use my company colors"

**What the AI will do:**
- Change colors of specific elements
- Make sure text is still readable
- Ensure it works in both light and dark modes

### Hiding/Showing Elements
**What you can ask:**
- "Hide the preview column"
- "Remove the status bar"
- "Show the file size column"
- "Hide the menu items I don't use"

**What the AI will do:**
- Hide or show specific interface elements
- Make sure important buttons stay visible
- Keep all functionality working

### Text and Fonts
**What you can ask:**
- "Make the text bigger"
- "Use a different font"
- "Make the labels bold"
- "Change the text color"

**What the AI will do:**
- Change font sizes and styles
- Apply different fonts
- Make sure text stays readable

### Layout and Spacing
**What you can ask:**
- "Make the form wider"
- "Add more space between rows"
- "Make the buttons bigger"
- "Adjust the margins"

**What the AI will do:**
- Change sizes and spacing
- Adjust layout carefully
- Keep everything aligned properly

## 🎯 Example Conversations

### Example 1: Simple Color Change
**You:** "Can you make the buttons blue?"

**AI:** "I'll change the primary action buttons to blue for you. I'll add this to your override.css file:

```css
.dhx_button--color_primary {
    background-color: #0056b3 !important;
}
```

Save the file and refresh your browser with Ctrl+F5 to see the blue buttons!"

### Example 2: Hiding Elements
**You:** "I want to hide the preview column in the file browser"

**AI:** "I'll hide the preview column for you. I'll add this to override.css:

```css
/* Hide preview column (column index 7) */
.dhx_grid-cell:nth-child(8) {
    display: none !important;
}
```

This will hide the preview column while keeping all other functionality intact. Save and refresh to see the change."

### Example 3: Multiple Changes
**You:** "Can you make the headers dark blue and the rows alternate between light and dark gray?"

**AI:** "I'll make both of those changes for you. Here's what I'll add to override.css:

```css
/* Dark blue headers */
.dhx_grid-header {
    background-color: #003366 !important;
    color: white !important;
}

/* Alternating row colors */
.dhx_grid-row:nth-child(odd) {
    background-color: #f8f9fa !important;
}

.dhx_grid-row:nth-child(even) {
    background-color: #e9ecef !important;
}
```

Save the file and refresh your browser. The headers will be dark blue with white text, and rows will alternate between light and dark gray."

## 🌓 Light and Dark Mode

Your webinterface has two themes:
- **Light mode**: Bright colors, white backgrounds
- **Dark mode**: Dark colors, dark backgrounds

The AI will make sure your changes work in **both modes**. You can switch between modes in your webinterface settings.

## ⚠️ What's Safe and What's Not

### ✅ Safe Changes
- Changing colors
- Hiding/showing columns
- Adjusting text size
- Changing fonts
- Modifying spacing

**Note**: File safety is guaranteed - you can only modify `override.css`. All other files are packed inside the EXE and inaccessible.

### ⚠️ Changes That Need Care
- Moving elements around
- Major layout changes
- Hiding important buttons
- Changing how things work

### ❌ Changes the AI Won't Make
- Anything that breaks functionality
- Hiding critical buttons or menus
- Changes that only work in one theme
- Anything that makes the interface unusable

### 🔄 Content vs Styling (Important!)

**Some things are NOT styling - they're content from your FFAStrans workflow:**

**Job Viewer (Job Monitor) Content:**
- Job results, status messages, outcomes
- Images, links, or custom HTML in job results
- Data displayed in job rows

**To Add Custom Content to Job Results:**
1. Configure this in your FFAStrans workflow (not CSS)
2. Use FFAStrans builtin variables: `s_success` or `s_error`
3. Add your HTML: e.g., `<img src="/folder/image.jpg">`
4. Make sure folders are added in WebUI Admin → Added Folders

**Example:**
```ffastrans
# In your FFAStrans job:
Set s_success = "<img src='/myfiles/thumbnail.jpg'> Job completed!"
```

**What the AI CAN Style:**
- How the job list looks (colors, fonts, spacing)
- Grid layout and structure
- Row and column appearance
- Header styling

**What the AI CANNOT Style:**
- What content appears in job results
- Images or links in results (configure in workflow)
- Job status information
- Data displayed in cells

**Quick Test:**
- "Make it look different" → ✅ Styling (AI can help)
- "Show different information" → ❌ Content (configure in FFAStrans workflow)
- "Add an image to the result" → ❌ Content (configure in FFAStrans workflow)

## 🔧 How to Undo Changes

If you don't like a change:
1. Open `override.css`
2. Find the CSS the AI added
3. Delete it or comment it out (add `/*` before and `*/` after)
4. Save the file
5. Refresh your browser

## 🆘 Getting Help

### Source Code Reference
- **GitHub Repository**: https://github.com/emcodem/ffastrans_webui
- **Purpose**: AI agents can access source code to understand page structure and provide accurate styling
- **Note**: You run FFAStrans as an EXE, but agents can reference GitHub for precise styling solutions

### If Something Looks Wrong
1. **Tell the AI what's wrong**: "The buttons disappeared" or "The text is hard to read"
2. **The AI will fix it**: They'll adjust the CSS to solve the problem
3. **Test again**: Refresh your browser to see the fix

### If You Don't Know What to Ask
Try these prompts:
- "What can I change about the appearance?"
- "Can you make the interface look more modern?"
- "How can I customize the colors?"
- "What styling options are available?"

## 🎨 Common Styling Goals

### Make It Look Professional
**Ask**: "Can you make it look more professional?"

**AI might**: Use a consistent color scheme, improve spacing, use better fonts

### Match Your Brand
**Ask**: "Can you use my company colors? [describe colors or provide hex codes]"

**AI might**: Apply your brand colors to buttons, headers, accents

### Improve Readability
**Ask**: "Can you make the text easier to read?"

**AI might**: Increase font size, improve contrast, adjust spacing

### Simplify the Interface
**Ask**: "Can you hide the elements I don't use?"

**AI might**: Hide optional columns, simplify menus, remove decorative elements

## 💡 Tips for Best Results

### Be Specific
- ✅ "Make the submit button blue"
- ❌ "Make it blue"

### Describe What You See
- ✅ "The file list headers"
- ❌ "The top thing"

### Mention Multiple Changes
- ✅ "Can you make the headers blue and the rows alternate colors?"
- ❌ "Change the colors"

### Ask for Options
- ✅ "What color options would look good?"
- ❌ "Pick a color"

## 🎯 What to Expect

### The AI Will:
- ✅ Understand your request in plain English
- ✅ Make safe changes that won't break anything
- ✅ Explain what it's changing and why
- ✅ Make sure changes work in both light and dark modes
- ✅ Help you if something doesn't look right

### The AI Won't:
- ❌ Make changes that break functionality
- ❌ Hide important buttons or menus
- ❌ Do anything that only works in one theme
- ❌ Make changes without explaining them

## 🚀 Ready to Start?

Just tell the AI what you want to change! You can start with simple things like:
- "Make the buttons blue"
- "Hide the preview column"
- "Make the text bigger"

The AI will handle all the technical details and make sure everything works perfectly.

---

**Remember**: You don't need to know CSS or programming - just describe what you want in plain English, and the AI will make it happen safely!