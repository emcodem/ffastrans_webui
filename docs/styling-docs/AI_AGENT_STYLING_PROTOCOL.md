# FFAStrans Webinterface - AI Agent Styling Protocol

## 🤖 Purpose

This document provides AI agents with complete technical specifications for safely styling the FFAStrans webinterface on behalf of non-technical users.

## 🎯 Agent Objectives

1. **Understand System Architecture** - CSS loading order, file structure, safety boundaries
2. **Interpret User Requests** - Translate non-technical requests into precise CSS
3. **Generate Safe CSS** - Only modify `override.css`, never touch core files
4. **Validate Changes** - Ensure changes won't break functionality
5. **Explain Clearly** - Provide non-technical users with understandable explanations

## 🏗️ System Architecture

### Source Code Reference
- **GitHub Repository**: https://github.com/emcodem/ffastrans_webui
- **Purpose**: Access source code for page identification, styling analysis, and understanding component structure
- **Usage**: Agents can reference GitHub to examine HTML files and identify correct CSS selectors

### Distribution Context
**IMPORTANT**: FFAStrans is distributed as an EXE file with all CSS and HTML files packed inside, EXCEPT for `override.css`. This means:

- ✅ **Users physically CAN'T modify core files** - they're inside the EXE
- ✅ **override.css is the ONLY accessible file** - it's external to the EXE
- ✅ **File safety is guaranteed by packaging** - no accidental modifications possible
- ⚠️ **Focus on functional safety** - ensure CSS changes don't break features

### File Structure
```
FFAStrans EXE (contains):
├── webinterface\
│   ├── components\           # Static HTML pages (PACKAGED - inaccessible)
│   ├── dependencies\
│   │   ├── css\
│   │   │   └── global.css   # Global CSS (PACKAGED - inaccessible)
│   │   └── dhtmlx\
│   │       ├── dhtmlx.css   # Default theme (PACKAGED - inaccessible)
│   │       └── dhtmlx_benjamin.css  # Dark theme (PACKAGED - inaccessible)

External to EXE:
└── alternate-server\
    └── css\
        └── override.css # ✅ ONLY FILE USERS CAN MODIFY
```

### CSS Loading Order (Priority)
1. dhtmlx framework CSS (v6+ suite.css)
2. dhtmlx v5 CSS (dhtmlx.css or dhtmlx_benjamin.css)
3. global.css (framework-independent rules)
4. Page-specific inline styles
5. **override.css (HIGHEST PRIORITY - YOUR TARGET)**

### Theme System
- **Light mode**: Uses `dhtmlx.css`
- **Dark mode**: Uses `dhtmlx_benjamin.css`
- **Control**: `localStorage.global_skin_dark = "1"` enables dark mode
- **Requirement**: All changes must work in BOTH themes

## 🎯 General Styling Methodology

### Step 0: Check for Existing Customization Options

**CRITICAL FIRST STEP**: Before implementing any CSS changes, check if FFAStrans already provides built-in customization options for the user's request.

**Built-in Customization Options (WebUI Admin):**

**Access**: Navigate to ADMIN → WebUI in the navigation bar (click the ⚙️ symbol)

**Available Options:**

1. **Header Name**
   - **Purpose**: Change the top-left displayed text
   - **Location**: WebUI Admin → "Header name" field
   - **HTML Support**: ✅ YES - Supports HTML tags (e.g., `<b>`, `<i>`, `<span>`, etc.)
   - **When to use**: User wants to change the branding/title text
   - **CSS alternative**: Not recommended - use built-in option
   - **Examples**: 
     - Plain text: "My Company"
     - With HTML: "<b>My</b> <i>Company</i>"
     - With styling: "<span style='color: blue'>My Company</span>"

2. **Welcome Message**
   - **Purpose**: Change the login page text/message
   - **Location**: WebUI Admin → "Welcome Message" field
   - **HTML Support**: ✅ YES - Supports HTML tags (e.g., `<b>`, `<i>`, `<span>`, `<br>`, etc.)
   - **When to use**: User wants to customize login page text
   - **CSS alternative**: Not recommended - use built-in option
   - **Examples**:
     - Plain text: "Welcome to My Portal"
     - With HTML: "Welcome to <b>My Portal</b>"
     - With styling: "<span style='font-size: 18px; color: #0056b3;'>Welcome to My Portal</span>"
     - Multi-line: "Welcome to<br><b>My Portal</b><br>Please login"

3. **Added Folders**
   - **Purpose**: Serve static files from additional folders (with authentication)
   - **Location**: WebUI Admin → "Added Folders" section
   - **How it works**: Webserver checks if folders exist at startup and serves files under `/foldername`
   - **Security**: Requires user authentication
   - **When to use**: User wants to serve custom static content (CSS, images, etc.)

4. **Added Unsafe Folders**
   - **Purpose**: Serve static files from additional folders (WITHOUT authentication)
   - **Location**: WebUI Admin → "Added Unsafe Folders" section
   - **How it works**: Same as Added Folders but accessible without login
   - **Security**: NO authentication required
   - **When to use**: Public resources that don't need authentication

**Decision Framework:**

```
User Request: "Change X"
    ↓
Does WebUI Admin have a built-in option for this?
    ├─ YES → Use built-in option (RECOMMENDED)
    └─ NO  → Proceed with CSS customization
```

**Examples:**

**User Request**: "Change the title text in the top left"
- ✅ **Use**: WebUI Admin → "Header name" field
- ❌ **Don't use**: CSS to hide/replace text

**User Request**: "Customize the login page message"
- ✅ **Use**: WebUI Admin → "Welcome Message" field
- ❌ **Don't use**: CSS to hide/replace text

**User Request**: "Add custom CSS files"
- ✅ **Use**: WebUI Admin → "Added Folders" → Add folder containing CSS
- ✅ **Then**: Reference via `<link rel="stylesheet" href="/yourfolder/style.css">`
- ❌ **Don't use**: Try to modify core CSS files

**User Request**: "Change button colors"
- ✅ **Use**: CSS customization in `override.css`
- ❌ **Don't use**: No built-in option available

**Why This Matters:**
- Built-in options are safer and more maintainable
- Built-in options are designed to work correctly with the system
- CSS workarounds for built-in features can break functionality
- Users should use the intended customization methods first

### Step 0.5: Identify the Target Page

**CRITICAL CONTEXT**: Users run FFAStrans as a standalone EXE, so they cannot directly access source code files. When users navigate to different pages, the URL bar always shows `index.html` because pages are loaded as iframes.

**The Problem:**
- Users see different pages in the interface but can't identify which HTML file is loaded
- URL bar always shows `index.html` (iframe container)
- Users will say "change the page I'm looking at" without specifying the file
- Agents need to identify the correct HTML file to provide accurate styling

**Navigation Structure:**
- Users see 6 items in the navigation bar (depending on permissions)
- Clicking items loads different static HTML pages as iframes
- All pages are located in: `webinterface/components/`

**Agent Workflow for Page Identification:**

**Step A: Ask Clarifying Questions**
When user says "change the page I'm looking at" or similar, ask:

1. **Navigation Context**: "Which navigation item did you click to get to this page?"
   - Examples: "Job Starter", "Job Viewer", "Scheduler", "Log Viewer", etc.

2. **Visual Description**: "Can you describe what you see on this page?"
   - Examples: "I see a file browser and form", "I see a list of jobs", etc.

3. **Page Purpose**: "What is this page used for?"
   - Examples: "For submitting jobs", "For viewing job status", etc.

**Step B: Map to Source File**

Based on user's response, identify the HTML file:

| Navigation Item | HTML File | Location |
|----------------|-----------|----------|
| Job Starter | `jobstarter.html` | `webinterface/components/` |
| Job Viewer | `jobviewer.html` | `webinterface/components/` |
| Scheduler | `scheduler.html` | `webinterface/components/` |
| Log Viewer | `logviewer.html` | `webinterface/components/` |
| Review Queue | `reviewqueue.html` | `webinterface/components/` |
| Workflow Canvas | `worfklowcanvas.html` | `webinterface/components/` |

**Step C: Access Source Code**

**Option 1: Check GitHub Repository**
- **Repository**: https://github.com/emcodem/ffastrans_webui
- Search for the identified HTML file in the FFAStrans GitHub repository
- Read the file to understand the page structure and elements
- Identify relevant CSS selectors and component structure

**Option 2: Ask User for Source Code**
- If GitHub access is not available or file is not found
- Ask user: "Can you provide the source code for [filename]?"
- User can copy the HTML content from their development environment
- Use the provided code to analyze the page structure

**Step D: Analyze Page Structure**

Once source code is obtained:
1. **Identify key elements**: Look for main containers, forms, grids, etc.
2. **Find CSS classes**: Note the class names and IDs used in the HTML
3. **Understand component structure**: Identify dhtmlx components and their classes
4. **Map to styling targets**: Determine which CSS selectors to use

**Example Conversation:**

**User**: "Change the buttons on the page I'm looking at"

**Agent**: "I need to identify which page you're referring to. Can you tell me:
1. Which navigation item did you click to get to this page?
2. What do you see on this page (file browser, job list, etc.)?"

**User**: "I clicked Job Starter and I see a file browser on the left and a form on the right"

**Agent**: "Thanks! That's the Job Starter page (`jobstarter.html`). Let me check the source code to identify the right button selectors..."

**Decision Framework:**

```
User refers to "the page I'm looking at"
    ↓
Ask clarifying questions about navigation and visual content
    ↓
Identify the HTML file based on navigation item
    ↓
Access source code (GitHub or ask user)
    ↓
Analyze page structure and identify CSS selectors
    ↓
Proceed with styling solution
```

**Why This Matters:**
- **Accuracy**: Ensures CSS targets the correct page and elements
- **Efficiency**: Avoids trial-and-error with wrong selectors
- **User Experience**: Provides correct styling on first attempt
- **Troubleshooting**: Enables agents to debug issues by examining actual source code

**Common Page Identification Patterns:**

**"File browser"** → Likely Job Starter (`jobstarter.html`)
**"Job list"** → Likely Job Viewer (`jobviewer.html`)  
**"Schedule/timeline"** → Likely Scheduler (`scheduler.html`)
**"Log files"** → Likely Log Viewer (`logviewer.html`)
**"Review queue"** → Likely Review Queue (`reviewqueue.html`)

**Important Notes:**
- Always verify the page identification before generating CSS
- Don't assume based on vague descriptions
- Source code access is essential for accurate styling
- When in doubt, ask for more specific visual details

### Systematic Approach to Any Styling Request

**Step 1: Analyze the Request**
- Parse user's non-technical description
- Identify the visual goal (color, layout, visibility, etc.)
- Determine scope (specific element vs global change)
- **CRITICAL**: Distinguish between styling changes vs content changes

**Content vs Styling Decision Framework:**
```
User Request: "Change X"
    ↓
Is this about appearance (colors, layout, spacing)?
    ├─ YES → This is styling → Proceed with CSS
    └─ NO  → This is content → Explain workflow configuration needed
```

**Content Changes (NOT CSS):**
- Adding images, links, or HTML to job results
- Changing what information is displayed
- Modifying job status messages
- Custom data in workflow-generated content

**Styling Changes (CSS):**
- Colors, fonts, spacing
- Layout and positioning
- Element visibility
- Visual appearance

**Example:**
- "Add image to job result" → Content (configure in FFAStrans workflow)
- "Make job list blue" → Styling (use CSS)
- "Show different job information" → Content (configure in FFAStrans workflow)
- "Change job list font size" → Styling (use CSS)

**Step 2: Theme Decision Framework**
- **Ask**: Will this styling work identically in both light and dark modes?
- **If YES**: Use universal CSS (no theme-specific media queries)
- **If NO**: Use theme-specific CSS with `@media (prefers-color-scheme: dark)`

**Step 3: Color/Contrast Validation**
- **Background color changes**: Always ensure text contrast meets WCAG AA standards
- **Text color changes**: Always test against both light and dark backgrounds
- **Universal rule**: Never set text color without ensuring background contrast

**Step 4: Functionality Risk Assessment**
- **Ask**: Could this change hide, disable, or break any interactive element?
- **High-risk targets**: Buttons, inputs, menus, navigation, form controls
- **Safe targets**: Decorative elements, spacing, borders, shadows

**Step 5: Generate CSS**
- Use specific selectors to avoid unintended effects
- Apply `!important` only when necessary (override framework styles)
- Include comments explaining the change

**Step 6: Theme Compatibility Testing**
- **Mental test**: Visualize the change in both light and dark modes
- **Text readability**: Ensure text remains readable in both themes
- **Interactive elements**: Verify buttons/inputs remain visible and functional

### Common Pitfalls: Real-World Examples

**❌ OVER-ENGINEERING MISTAKE**

**User Request**: "Make the login page background blue"

**❌ WRONG APPROACH (Over-engineering):**
```css
/* Too many changes beyond what was requested */
body {
    background-color: #0056b3 !important;
    color: #ffffff !important;  /* Unnecessary */
}

#center {
    background-color: white !important;  /* Unnecessary */
    padding: 20px !important;  /* Unnecessary */
    border-radius: 8px !important;  /* Unnecessary */
    box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;  /* Unnecessary */
}

/* Theme-specific when not needed */
@media (prefers-color-scheme: dark) {
    body {
        background-color: #003366 !important;  /* Unnecessary */
    }
}
```

**Problems Caused:**
- ❌ Added styling for `#center` that wasn't requested
- ❌ Forced different colors for light/dark modes (broke light mode)
- ❌ Added padding/border rules that could break other customizations
- ❌ Made changes that conflicted with existing functionality

**✅ CORRECT APPROACH (Do exactly what was requested):**
```css
/* Only change what was requested */
body {
    background-color: #0056b3 !important;
}
```

**Why This Works:**
- ✅ Only changes the background color (what was requested)
- ✅ Works naturally in both light and dark modes
- ✅ Doesn't interfere with existing form styling
- ✅ Doesn't add unnecessary complexity

**Lesson Learned:**
- **Principle**: "Do exactly what was requested, nothing more"
- **Rule**: If the user didn't ask for it, don't add it
- **Test**: Ask yourself "Did the user request this specific change?"
- **Result**: Simple solutions are usually the best solutions

**Key Takeaway:**
When a user asks for a simple change (like "make background blue"), they want exactly that - not a complete redesign. Over-engineering breaks things and creates problems that didn't exist. Stick to the request and let existing styling work naturally with your change.

## 🎨 Theme Decision Framework

### Universal vs Theme-Specific Styling

**Use Universal CSS When:**
- ✅ Color changes work identically in both themes
- ✅ Spacing/padding changes are theme-independent
- ✅ Border/radius changes work the same in both themes
- ✅ Shadow effects work consistently

**Use Theme-Specific CSS When:**
- ⚠️ Background colors need different values for light/dark modes
- ⚠️ Text colors need to adapt to different backgrounds
- ⚠️ Images/icons need different styling per theme
- ⚠️ Any visual element that appears different in light vs dark mode

### Theme-Specific CSS Pattern

```css
/* Universal styles (work in both themes) */
.universal-element {
    border-radius: 8px;
    padding: 10px;
}

/* Light mode only */
@media (prefers-color-scheme: light) {
    .theme-aware-element {
        background-color: #ffffff;
        color: #000000;
    }
}

/* Dark mode only */
@media (prefers-color-scheme: dark) {
    .theme-aware-element {
        background-color: #2d2d2d;
        color: #ffffff;
    }
}
```

## 🌈 Color/Contrast Principles

### WCAG AA Standards (Minimum Requirements)

**Text Contrast:**
- **Normal text**: 4.5:1 contrast ratio minimum
- **Large text**: 3:1 contrast ratio minimum
- **Interactive elements**: 3:1 contrast ratio minimum

**Color Combinations That Work:**
- **Light backgrounds**: Dark text (#000000, #1a1a1a, #333333)
- **Dark backgrounds**: Light text (#ffffff, #f0f0f0, #e0e0e0)
- **Avoid**: Similar lightness values (e.g., light blue on light gray)

### Universal Color Rules

**When Changing Background Colors:**
1. **Always** specify text color if the background changes significantly
2. **Test** mentally: "If I make this blue, will black text still be readable?"
3. **Consider** both themes: "Will this work in dark mode too?"

**When Changing Text Colors:**
1. **Always** ensure contrast against expected backgrounds
2. **Avoid** hard colors that might clash with theme backgrounds
3. **Prefer** theme-neutral colors or use theme-specific rules

### Common Contrast Mistakes

**❌ WRONG:**
```css
body {
    background-color: #0056b3; /* Blue background */
    /* Forgot to change text color - white text becomes invisible */
}
```

**✅ RIGHT:**
```css
body {
    background-color: #0056b3;
    color: #ffffff; /* Ensure text contrast */
}

/* Or make it theme-aware */
@media (prefers-color-scheme: light) {
    body {
        background-color: #0056b3;
        color: #ffffff;
    }
}

@media (prefers-color-scheme: dark) {
    body {
        background-color: #003366; /* Darker blue for dark mode */
        color: #ffffff;
    }
}
```

## 🛡️ Functionality Preservation Principles

### Risk Assessment Framework

**Before Any CSS Change, Ask:**

1. **Visibility**: "Will this hide any buttons, inputs, or interactive elements?"
2. **Clickability**: "Will this make any element unclickable?"
3. **Usability**: "Will this make any feature harder to use?"
4. **Accessibility**: "Will this break keyboard navigation or screen readers?"

### High-Risk Elements (Never Hide/Disable)

**Critical Interactive Elements:**
- Submit buttons
- Navigation menus
- Form inputs and controls
- Close/Cancel buttons
- File selection controls
- Action buttons (save, delete, etc.)

**Medium-Risk Elements:**
- Information displays
- Status indicators
- Help text
- Optional features

**Safe Elements:**
- Decorative borders
- Spacing adjustments
- Color accents
- Shadow effects
- Non-essential visual elements

### Functionality Testing Checklist

**Before Providing CSS:**
- [ ] All buttons remain visible and clickable
- [ ] All inputs remain accessible
- [ ] Navigation remains functional
- [ ] No essential features are hidden
- [ ] Keyboard navigation still works
- [ ] Screen readers can still access content

## 🧪 Systematic Testing Approach

### Theme Compatibility Testing

**Step 1: Mental Visualization**
- Close your eyes and imagine the change in light mode
- Close your eyes and imagine the change in dark mode
- **Question**: "Does this look good and function well in BOTH?"

**Step 2: Text Readability Check**
- **Light mode**: "Is dark text readable on this background?"
- **Dark mode**: "Is light text readable on this background?"
- **Universal**: "Does text contrast meet WCAG standards in both?"

**Step 3: Interactive Element Verification**
- **Buttons**: "Are all buttons still visible and clickable?"
- **Inputs**: "Can users still see and use form fields?"
- **Menus**: "Is navigation still accessible?"

### Functionality Risk Assessment

**Step 1: Element Identification**
- List all elements affected by your CSS change
- Mark each as: Critical, Important, or Cosmetic

**Step 2: Impact Analysis**
- **Critical elements**: "Will this break any essential functionality?"
- **Important elements**: "Will this make features harder to use?"
- **Cosmetic elements**: "Is this purely visual?"

**Step 3: Risk Mitigation**
- **High-risk changes**: Don't do it, or find safer alternative
- **Medium-risk changes**: Add safeguards and test thoroughly
- **Low-risk changes**: Proceed with normal validation

### Responsive Design Validation

**Step 1: Size Consideration**
- **Question**: "Will this work on mobile screens?"
- **Question**: "Will this break on very large screens?"

**Step 2: Layout Impact**
- **Question**: "Will this change cause overflow or scrolling issues?"
- **Question**: "Will this break alignment on different screen sizes?"

## 🏗️ Architecture Understanding

### CSS Cascade and Priority

**Understanding Loading Order:**
1. **Framework CSS loads first** - Sets baseline styles
2. **Theme CSS loads second** - Applies light/dark theme
3. **Global CSS loads third** - Framework-independent rules
4. **Page styles load fourth** - Specific page customizations
5. **Your CSS loads last** - HIGHEST PRIORITY

**Priority Implications:**
- ✅ Your `!important` will override framework styles
- ⚠️ Use specific selectors to avoid unintended overrides
- ⚠️ Framework styles may still affect child elements

**When to Use `!important`:**
- ✅ Overriding framework !important rules
- ✅ Ensuring your styles take precedence
- ❌ Avoid when specific selectors work

### Component Framework Understanding

**dhtmlx Component System:**
- **Components have internal styling** - Framework manages appearance
- **CSS variables control theming** - Use variables when possible
- **Class names are framework-defined** - Don't invent new ones

**Working with Framework Components:**
- **Identify framework classes** - Use existing class names
- **Leverage CSS variables** - `--dhx-background-primary`, etc.
- **Respect component structure** - Don't break internal layouts

### Theme System Architecture

**How Themes Work:**
- **Light mode**: `dhtmlx.css` provides light theme variables
- **Dark mode**: `dhtmlx_benjamin.css` provides dark theme variables
- **Switch mechanism**: JavaScript swaps CSS files based on `localStorage.global_skin_dark`

**Theme-Aware vs Theme-Agnostic Elements:**
- **Theme-aware**: Elements that change appearance between themes (buttons, inputs, backgrounds)
- **Theme-agnostic**: Elements that look the same in both themes (borders, spacing, some shadows)

**Decision Framework:**
```
Is this element theme-aware?
├─ YES → Use theme-specific CSS or CSS variables
└─ NO  → Use universal CSS
```

### Integration Points and Boundaries

**Where override.css Interacts:**

**1. Global Level (`body`, `html`)**
- Affects entire interface
- **High impact** - affects all pages
- **Use carefully** - consider theme compatibility

**2. Component Level (`.dhx_grid`, `.dhx_window`)**
- Affects specific component types
- **Medium impact** - affects multiple instances
- **Test thoroughly** - ensure all instances work correctly

**3. Instance Level (specific IDs or unique classes)**
- Affects specific elements
- **Low impact** - targeted changes
- **Safest approach** - minimal side effects

**Boundary Rules:**
- ✅ **Safe**: Styling within component boundaries
- ⚠️ **Caution**: Styling that crosses component boundaries
- ❌ **Avoid**: Styling that affects framework internals

## 🚨 Safety Protocols

### ✅ GUARANTEED BY EXE PACKAGING
- ✅ Core files are physically inaccessible (packed inside EXE)
- ✅ Users can ONLY modify `override.css` (external file)
- ✅ No risk of accidental file modifications
- ✅ File structure is protected by distribution method

### ⚠️ FUNCTIONAL SAFETY (YOUR RESPONSIBILITY)
- ⚠️ Don't hide interactive elements (buttons, inputs, menus)
- ⚠️ Don't break responsive design
- ⚠️ Ensure changes work in BOTH light and dark modes
- ⚠️ Maintain text readability and accessibility
- ⚠️ Avoid overriding critical layout properties

### 🎯 FOCUS AREAS
Since file safety is guaranteed, focus on:
1. **Functional preservation** - keep all features working
2. **Theme compatibility** - work in both light and dark modes
3. **Accessibility** - maintain contrast and readability
4. **Responsive design** - don't break mobile layouts
5. **User experience** - don't make the interface confusing

## 🎨 Component Reference

### File Browser Grid
**Purpose**: Display files and folders with navigation

**Key Selectors**:
```css
.dhx_grid                    /* Main grid container */
.dhx_grid-row               /* Individual file/folder rows */
.dhx_grid-row:nth-child(even)  /* Alternate rows */
.dhx_grid-header            /* Column headers */
.dhx_grid-cell              /* Individual cells */
.dhx_grid-content           /* Scrollable content area */
```

**Common User Requests**:
- "Change row colors" → Target `.dhx_grid-row`
- "Hide specific columns" → Target `.dhx_grid-cell` with column index
- "Change header colors" → Target `.dhx_grid-header`

### Forms and Inputs
**Purpose**: User input for job submission and configuration

**Key Selectors**:
```css
.dhxform_obj_dhx_skyblue   /* Form container */
.dhxform_label             /* Field labels */
.dhxform_control           /* Input control wrapper */
.dhxform_control input     /* Text inputs */
.dhxform_control select    /* Dropdown selects */
.dhxform_control textarea  /* Text areas */
```

**Common User Requests**:
- "Change label colors" → Target `.dhxform_label`
- "Style input boxes" → Target `.dhxform_control input`
- "Make forms wider" → Target `.dhxform_obj_dhx_skyblue`

### Menus and Toolbars
**Purpose**: Navigation and action buttons

**Key Selectors**:
```css
.dhtmlxMenu_dhx_skyblue_Middle        /* Menu container */
.dhtmlxMenu_dhx_skyblue_TopLevel_Item_Normal    /* Menu items */
.dhtmlxMenu_dhx_skyblue_TopLevel_Item_Selected  /* Selected/hovered items */
.dhx_button                          /* Buttons */
.dhx_button--color_primary           /* Primary action buttons */
.dhx_toolbar                         /* Toolbar container */
```

**Common User Requests**:
- "Change menu colors" → Target menu item selectors
- "Style buttons" → Target `.dhx_button`
- "Change toolbar appearance" → Target `.dhx_toolbar`

### Windows and Modals
**Purpose**: Popup windows and dialogs

**Key Selectors**:
```css
.dhx_window                  /* Window container */
.dhx_window-header          /* Window title bar */
.dhx_window-body            /* Window content area */
.custom_window_small_borders  /* Custom window class */
```

**Common User Requests**:
- "Style popup windows" → Target `.dhx_window`
- "Change window headers" → Target `.dhx_window-header`

### Data Grids (General)
**Purpose**: Display tabular data (jobs, files, etc.)

**Key Selectors**:
```css
.dhx_grid                    /* Grid container */
.dhx_grid-header            /* Header row */
.dhx_grid-row               /* Data rows */
.dhx_grid-cell              /* Individual cells */
.dhx_grid-selected          /* Selected rows */
```

### Job Viewer (Job Monitor)
**Purpose**: Display job status and results from FFAStrans workflow

**Key Selectors**:
```css
.dhx_grid                    /* Main job list container */
.dhx_grid-row               /* Individual job rows */
.dhx_grid-cell              /* Job data cells */
.dhx_grid-header            /* Column headers */
```

**CRITICAL CONTENT DISTINCTION**:
- **Grid Structure**: Controlled by CSS (can style layout, colors, spacing)
- **Grid Content**: Populated by FFAStrans workflow (NOT controlled by CSS)
- **HTML Support**: Job outcome/result cells support HTML content from workflow

**Content vs Styling**:
```
User Request: "Add an image to the job result"
    ↓
Is this a styling change?
    ├─ NO → This requires FFAStrans workflow configuration
    └─ YES → Use CSS styling
```

**Workflow-Generated Content**:
- Job status, outcomes, and results are populated by FFAStrans jobs
- To add images, links, or custom HTML to job results:
  1. Configure in FFAStrans workflow (not CSS)
  2. Use FFAStrans builtin variables: `s_success` or `s_error`
  3. Populate with HTML: e.g., `<img src="/allowed-folder/image.jpg">`
  4. Reference files from WebUI Admin → Added Folders

**What CSS CAN Control**:
- Grid layout and structure
- Colors, fonts, spacing
- Row/column styling
- Header appearance
- Selection states

**What CSS CANNOT Control**:
- Job result content (images, links, text)
- Job status information
- Data displayed in cells
- HTML content within cells

**Example Workflow Configuration**:
```ffastrans
# In FFAStrans workflow job:
Set s_success = "<img src='/myfolder/thumbnail.jpg'> Job completed successfully"
Set s_error = "<a href='/logs/error.log'>View Error Log</a>"
```

**Common User Requests**:
- "Style the job list" → Target `.dhx_grid` and related selectors ✅ CSS
- "Add images to job results" → Configure in FFAStrans workflow ❌ Not CSS
- "Change job status colors" → Target `.dhx_grid-row` based on content ✅ CSS
- "Show custom links in results" → Configure in FFAStrans workflow ❌ Not CSS

**Agent Response Pattern**:
```
User: "Add an image to the job result"

Agent: "I can't add images through CSS styling. Job results are populated by your FFAStrans workflow. To add images:

1. In your FFAStrans workflow job, use the builtin variable s_success:
   Set s_success = "<img src='/yourfolder/image.jpg'> Your message"

2. Make sure the folder is added in WebUI Admin → Added Folders

3. The image will then appear in the job result automatically.

I CAN help you style how the job list looks (colors, spacing, fonts) - would you like me to do that instead?"
```

## 🔍 Element Identification Protocol

### Step 1: Understand User Request
Parse non-technical description:
- "Make it blue" → Color change request
- "Hide the thing on the left" → Element visibility request
- "Make text bigger" → Typography request
- "Move that over there" → Layout request

### Step 2: Identify Target Component
Map user description to technical component:
- "File list" → File browser grid
- "Buttons" → `.dhx_button` or menu items
- "Forms" → `.dhxform_*` selectors
- "Popups" → `.dhx_window` selectors

### Step 3: Select Appropriate Selector
Choose specific selector based on component reference above.

### Step 4: Generate CSS
Create CSS rule that:
- Uses specific selector
- Applies only intended changes
- Works in both themes
- Uses `!important` only when necessary
- Preserves functionality

### Step 5: Validate Safety
Check that change:
- ✅ Only targets `override.css`
- ✅ Doesn't hide interactive elements
- ✅ Doesn't break layout
- ✅ Works in both light and dark modes
- ✅ Maintains accessibility

## 📝 Common User Request Patterns

### Color Changes
**User says**: "Make it blue" / "Change the color"

**Agent process**:
1. Identify what "it" refers to (buttons, headers, etc.)
2. Choose appropriate color (blue = #0056b3 or similar)
3. Generate CSS:
```css
.target-element {
    background-color: #0056b3 !important;
    color: white !important;  /* Ensure contrast */
}
```

### Hiding Elements
**User says**: "Hide the X" / "Remove the Y"

**Agent process**:
1. Identify specific element
2. **CRITICAL**: Verify element isn't essential for functionality
3. Generate CSS:
```css
.element-to-hide {
    display: none !important;
}
```

### Typography Changes
**User says**: "Make text bigger" / "Change the font"

**Agent process**:
1. Identify text elements
2. Generate CSS:
```css
.target-element {
    font-size: 16px !important;
    font-family: 'Arial', sans-serif !important;
}
```

### Layout Adjustments
**User says**: "Make it wider" / "Move it over"

**Agent process**:
1. **CAUTION**: Layout changes are higher risk
2. Consider if spacing/padding can achieve same result
3. Generate CSS:
```css
.target-element {
    width: 300px !important;
    padding: 10px !important;
}
```

## 🧪 Testing Protocol

### Mental Validation Checklist
Before providing CSS to user, verify:

- [ ] Selector is specific enough
- [ ] Only modifies visual appearance
- [ ] Doesn't hide interactive elements
- [ ] Works in both light and dark modes
- [ ] Maintains text readability
- [ ] Doesn't break responsive design
- [ ] Uses `!important` only when necessary
- [ ] Preserves all functionality
- [ ] File safety is guaranteed (EXE packaging) ✅

### Common Failure Modes

**Too broad selector**:
- ❌ `div { color: red; }`
- ✅ `.specific-element { color: red; }`

**Hiding critical elements**:
- ❌ Hiding submit buttons or navigation
- ✅ Only hiding decorative elements

**Theme-specific issues**:
- ❌ Colors that work in light mode but not dark
- ✅ Test mentally in both themes

**Breaking functionality**:
- ❌ Changing `display: none` on interactive elements
- ✅ Only visual modifications

**Accessibility issues**:
- ❌ Poor contrast ratios
- ❌ Unreadable text
- ✅ Maintain WCAG AA standards

## 💬 User Communication Protocol

### Explaining Changes
When providing CSS to user, always include:

1. **What changed**: Clear description of visual effect
2. **Where to apply**: File path and location
3. **How to test**: Instructions for verifying
4. **Safety note**: Reassurance that change is safe

### Example Response Format
```
I'll help you change the button colors to blue. Here's what I'll do:

**Change**: Make all primary action buttons blue
**File**: C:\dev\ffastrans_webui\alternate-server\css\override.css
**Safety**: This only changes colors, won't affect functionality

Add this CSS to override.css:
```css
.dhx_button--color_primary {
    background-color: #0056b3 !important;
}
```

**To test**: Save the file and refresh your browser with Ctrl+F5
```

### Handling Ambiguity
If user request is unclear:
1. Ask for clarification
2. Provide options with visual descriptions
3. Explain trade-offs of different approaches

## 🚨 Emergency Protocols

### If Something Breaks
1. **Immediate rollback**: Delete/edit the problematic CSS from `override.css`
2. **Identify cause**: Review what CSS was added
3. **Provide fix**: Correct the CSS rule
4. **Explain clearly**: What went wrong and how to fix

### Red Flags to Watch For
- User reports functionality missing
- Layout appears broken
- Elements not responding to clicks
- Text becomes unreadable
- Styles not applying at all
- Changes only work in one theme

### Easy Rollback Process
Since only `override.css` can be modified:
1. Open `override.css` in any text editor
2. Find the problematic CSS
3. Delete it or comment it out (add `/* */` around it)
4. Save the file
5. Refresh browser (Ctrl+F5)

**Note**: File safety is guaranteed by EXE packaging - you can't accidentally break core files.

## ⚠️ High-Risk Changes (Focus on Functionality)

Since file modification is impossible due to EXE packaging, focus on functional risks:

### 🚨 CRITICAL RISKS
- Hiding submit buttons or navigation elements
- Breaking form inputs or validation
- Making text unreadable (contrast issues)
- Breaking responsive layouts
- Disabling essential features

### ⚠️ MODERATE RISKS
- Overriding layout properties (position, display, float)
- Theme-specific changes (only work in one mode)
- Complex selector chains (hard to maintain)
- Performance-heavy CSS (animations, shadows)

### ✅ SAFE CHANGES
- Color modifications
- Typography adjustments
- Spacing and padding changes
- Border and radius styling
- Element visibility (non-critical elements)

### Theme-Specific Styles
```css
/* Light mode only */
@media (prefers-color-scheme: light) {
    .element {
        background-color: #ffffff;
    }
}

/* Dark mode only */
@media (prefers-color-scheme: dark) {
    .element {
        background-color: #2d2d2d;
    }
}
```

### Responsive Adjustments
```css
/* Mobile devices */
@media (max-width: 768px) {
    .element {
        font-size: 12px;
    }
}
```

### Hover States
```css
.element:hover {
    background-color: #hover-color;
    transition: background-color 0.3s ease;
}
```

## 🎯 Success Criteria

Agent successfully completes request when:
1. ✅ User's visual goal is achieved
2. ✅ CSS is added only to `override.css` (guaranteed by EXE packaging)
3. ✅ No functionality is broken
4. ✅ Changes work in both themes
5. ✅ User understands what was changed
6. ✅ User can test and verify changes
7. ✅ Accessibility is maintained
8. ✅ Responsive design is preserved

---

**Agent Instructions**: Use this protocol as your complete reference for styling the FFAStrans webinterface. Remember that file safety is guaranteed by EXE packaging - focus on functional safety, clear communication, and providing non-technical users with styling solutions that work perfectly.