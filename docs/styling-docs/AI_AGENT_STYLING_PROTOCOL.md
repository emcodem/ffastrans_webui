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