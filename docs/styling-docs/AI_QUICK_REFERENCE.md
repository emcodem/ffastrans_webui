# AI Agent Quick Reference - FFAStrans Styling

## 🎯 One-Sentence Purpose
Safely style FFAStrans webinterface by ONLY modifying `override.css` for non-technical users.

## 🚨 CRITICAL RULES
- ✅ **ONLY MODIFY**: `override.css` (only file external to EXE)
- ✅ **FILE SAFETY GUARANTEED**: All other files are packed inside EXE and inaccessible
- ⚠️ **FOCUS ON FUNCTIONAL SAFETY**: Don't break features, hide critical elements, or create theme-specific issues
- ⚠️ **ALWAYS TEST**: Changes must work in BOTH light and dark modes

## 🏗️ System Architecture
**Source Code**: https://github.com/emcodem/ffastrans_webui
**Purpose**: Access source code for page identification and styling analysis

```
CSS Loading Priority:
1. dhtmlx framework CSS
2. dhtmlx v5 CSS (dhtmlx.css or dhtmlx_benjamin.css)
3. global.css
4. Page-specific styles
5. override.css ← YOUR TARGET (highest priority)
```

## 🎨 Key Component Selectors

### File Browser
```css
.dhx_grid              /* Main grid */
.dhx_grid-row         /* File/folder rows */
.dhx_grid-header      /* Column headers */
.dhx_grid-cell        /* Individual cells */
```

### Forms
```css
.dhxform_label        /* Field labels */
.dhxform_control      /* Input wrapper */
.dhxform_control input  /* Text inputs */
```

### Menus/Buttons
```css
.dhx_button           /* All buttons */
.dhx_button--color_primary  /* Primary buttons */
.dhtmlxMenu_dhx_skyblue_TopLevel_Item_Normal  /* Menu items */
```

### Windows
```css
.dhx_window           /* Popup windows */
.dhx_window-header    /* Window title bar */
```

### Job Viewer (Content vs Styling)
**CRITICAL**: Job content is populated by FFAStrans workflow, NOT CSS

**What CSS CAN Style:**
```css
.dhx_grid              /* Job list structure */
.dhx_grid-row         /* Row appearance */
.dhx_grid-header      /* Header styling */
```

**What CSS CANNOT Control:**
- Job result content (images, links, text)
- Job status information
- HTML content in cells

**For Custom Job Content:**
- Configure in FFAStrans workflow
- Use builtin variables: `s_success` or `s_error`
- Example: `Set s_success = "<img src='/folder/image.jpg'> Done"`
- Add folders in WebUI Admin → Added Folders

**User Request Pattern:**
```
"Add image to job result" → Configure in FFAStrans workflow (NOT CSS)
"Style job list colors" → Use CSS styling ✅
```

## 📝 Common User Request Patterns

### "Make it blue/green/red"
```css
.target-element {
    background-color: #0056b3 !important;
    color: white !important;  /* Ensure contrast */
}
```

### "Hide the X"
```css
.element-to-hide {
    display: none !important;
}
```

### "Make text bigger"
```css
.target-element {
    font-size: 16px !important;
}
```

### "Change the font"
```css
.target-element {
    font-family: 'Arial', sans-serif !important;
}
```

## 🧪 Safety Checklist
Before providing CSS, verify:
- [ ] Only modifies `override.css` (file safety guaranteed by EXE packaging) ✅
- [ ] Doesn't hide interactive elements
- [ ] Works in both light and dark modes
- [ ] Maintains text readability
- [ ] Doesn't break responsive design
- [ ] Preserves all functionality
- [ ] Accessibility is maintained

## ⚠️ High-Risk Changes (Avoid)
- Overriding `position`, `display`, `float`
- Hiding buttons, inputs, or menus
- Breaking responsive design
- Theme-specific changes

## 💬 Response Format
```
**Change**: [brief description]
**File**: C:\dev\ffastrans_webui\alternate-server\css\override.css
**Safety**: [reassurance]

Add this CSS:
```css
[your CSS here]
```

**To test**: Save and refresh with Ctrl+F5
```

## 🚨 Emergency Rollback
If user reports issues:
1. Identify problematic CSS
2. Provide corrected version
3. Explain what went wrong

## 📚 Full Documentation
- Complete protocol: `AI_AGENT_STYLING_PROTOCOL.md`
- User guide: `USER_STYLING_GUIDE.md`

---

**Remember**: Safety first, clear communication, always explain changes to non-technical users.