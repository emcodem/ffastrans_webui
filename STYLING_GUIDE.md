# FFAStrans Webinterface Styling Guide

## Overview

This guide enables AI agents and users to safely alter the visual style of the FFAStrans webinterface through CSS customization. The webinterface uses a combination of static HTML pages, dhtmlx components (both v5 and v6+), and a global override system.

## Architecture

### File Structure

```
C:\dev\ffastrans_webui\
├── webinterface\
│   ├── components\           # Static HTML pages
│   │   ├── jobstarter.html
│   │   ├── jobviewer.html
│   │   ├── login.mustache
│   │   └── [other pages]
│   ├── dependencies\
│   │   ├── css\
│   │   │   └── global.css   # Global CSS rules
│   │   └── dhtmlx\
│   │       ├── dhtmlx.css   # Default dhtmlx v5 theme
│   │       ├── dhtmlx_benjamin.css  # Dark mode theme
│   │       └── [version folders]\  # dhtmlx v6+ suites
│   └── alternate-server\
│       └── css\
│           └── override.css # User customizations (loaded last)
```

### CSS Loading Order

1. **dhtmlx framework CSS** (v6+ suite.css)
2. **dhtmlx v5 CSS** (dhtmlx.css or dhtmlx_benjamin.css for dark mode)
3. **global.css** - Framework-independent rules
4. **Page-specific styles** (inline `<style>` blocks)
5. **override.css** - User customizations (loaded last, highest priority)

### Theme System

The webinterface supports a light/dark theme toggle controlled by `localStorage.global_skin_dark`:

```javascript
if (localStorage.global_skin_dark == "1"){
    // Switch to dark mode
    document.querySelector("#theme_loader").href = 
        document.querySelector("#theme_loader").href.replace("dhtmlx.css","dhtmlx_benjamin.css")
    dhx.setTheme("dark");
    dhx8.dhx.setTheme("dark");
}
```

## Safe Customization Guidelines

### ✅ Recommended Approaches

1. **Use override.css** - All user styles should go here
2. **Target specific elements** - Use precise selectors
3. **Test incrementally** - Add changes gradually
4. **Use CSS variables** - Leverage dhtmlx's variable system
5. **Preserve functionality** - Don't hide interactive elements

### ❌ Avoid

1. **Modifying core CSS files** - Don't edit dhtmlx.css or global.css
2. **Using !important excessively** - It breaks maintainability
3. **Hiding critical UI elements** - Users need access to all features
4. **Breaking responsive layouts** - Test on different screen sizes
5. **Overriding framework internals** - Stick to public APIs

## CSS Variable System

### dhtmlx v6+ Variables

dhtmlx v6+ uses CSS variables for theming. Key variables include:

```css
/* Colors */
--dhx-background-primary
--dhx-background-secondary
--dhx-border-color
--dhx-color-primary
--dhx-text-color

/* Spacing */
--dhx-spacing-unit

/* Typography */
--dhx-font-family
--dhx-font-size
```

### Custom Variables

The webinterface defines custom variables:

```css
:root {
    --preview-display: "none";  /* Controls preview visibility */
}
```

## Common Customization Patterns

### 1. Color Customization

```css
/* Override primary colors */
.dhx_button--color_primary {
    background-color: #your-color !important;
}

/* Change grid header colors */
.dhx_grid-header {
    background-color: #your-color !important;
}
```

### 2. Element Visibility

```css
/* Hide specific elements */
.specific-element-class {
    display: none !important;
}

/* Show hidden elements */
.hidden-element {
    display: block !important;
}
```

### 3. Typography

```css
/* Change font family */
body, .dhx_widget {
    font-family: 'Your Font', sans-serif !important;
}

/* Adjust font sizes */
.dhx_grid-cell {
    font-size: 14px !important;
}
```

### 4. Layout Adjustments

```css
/* Adjust spacing */
.dhx_layout-cell {
    padding: 10px !important;
}

/* Modify grid dimensions */
.dhx_grid {
    height: 100% !important;
}
```

## Component-Specific Guidance

### File Browser Grid

```css
/* File browser rows */
.dhx_grid-row {
    background-color: #your-color;
}

/* Alternate row coloring */
.alternate_row .dhx_grid-row:nth-child(2n) {
    background-color: #your-color;
}

/* Folder icons */
.folder_icon {
    background-image: url(../dependencies/fancytree/skin-ffastrans/your-icon.png);
}
```

### Forms and Inputs

```css
/* Form labels */
.dhxform_label {
    color: #your-color !important;
    font-weight: bold;
}

/* Input fields */
.dhxform_control input {
    border-color: #your-color !important;
}
```

### Menus and Toolbars

```css
/* Menu items */
.dhtmlxMenu_dhx_skyblue_TopLevel_Item_Normal {
    background-color: #your-color;
}

/* Menu hover states */
.dhtmlxMenu_dhx_skyblue_TopLevel_Item_Selected {
    background-color: #your-hover-color;
}
```

### Windows and Modals

```css
/* Custom window styling */
.custom_window_small_borders {
    border: 2px solid #your-color;
}

/* Window headers */
.dhx_window-header {
    background-color: #your-color;
}
```

## Dark Mode Considerations

When customizing for dark mode:

1. **Test both themes** - Ensure styles work in light and dark modes
2. **Use theme-aware selectors** - Target both dhtmlx.css and dhtmlx_benjamin.css
3. **Leverage CSS variables** - They automatically adapt to theme changes
4. **Consider contrast** - Ensure text remains readable

```css
/* Theme-aware styling */
@media (prefers-color-scheme: dark) {
    .your-element {
        color: #light-color;
        background-color: #dark-color;
    }
}
```

## Responsive Design

The webinterface uses responsive design principles:

```css
/* Mobile adjustments */
@media (max-width: 768px) {
    .dhx_layout-cell {
        min-width: 50px;
    }
    
    .dhx_toolbar {
        flex-direction: column;
    }
}
```

## Testing and Validation

### Testing Checklist

- [ ] Visual appearance in light mode
- [ ] Visual appearance in dark mode
- [ ] All interactive elements remain functional
- [ ] No layout breaks on different screen sizes
- [ ] Text remains readable
- [ ] No JavaScript errors in browser console
- [ ] Performance is not degraded

### Browser Testing

Test in multiple browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari (if applicable)

### Common Issues

**Issue**: Styles not applying
- **Solution**: Check selector specificity and loading order

**Issue**: Dark mode not working
- **Solution**: Ensure styles work with both dhtmlx.css and dhtmlx_benjamin.css

**Issue**: Layout broken
- **Solution**: Avoid overriding critical layout properties

## Advanced Customization

### CSS Grid and Flexbox

```css
/* Modern layout techniques */
.dhx_layout-container {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 10px;
}
```

### Animations and Transitions

```css
/* Smooth transitions */
.dhx_button {
    transition: all 0.3s ease;
}

.dhx_button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}
```

### Custom Scrollbars

```css
/* Webkit browsers */
.dhx_grid-content::-webkit-scrollbar {
    width: 10px;
}

.dhx_grid-content::-webkit-scrollbar-track {
    background: #your-color;
}

.dhx_grid-content::-webkit-scrollbar-thumb {
    background: #your-color;
    border-radius: 5px;
}
```

## Maintenance and Updates

### Version Control

- Keep override.css in version control
- Document customizations with comments
- Use semantic class names

### Upgrading dhtmlx

When upgrading dhtmlx versions:
1. Test all customizations
2. Check for deprecated CSS classes
3. Update selectors if needed
4. Verify variable names haven't changed

### Rollback Strategy

Keep backup of working override.css:
```bash
cp override.css override.css.backup
```

## Resources

### dhtmlx Documentation
- dhtmlx v5: [Legacy Documentation](https://docs.dhtmlx.com/)
- dhtmlx v6+: [Suite Documentation](https://docs.dhtmlx.com/suite/)

### CSS Resources
- CSS Variables: [MDN Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- Flexbox: [CSS Tricks Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- Grid: [CSS Tricks Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)

## Troubleshooting

### Styles Not Loading

1. Check browser console for errors
2. Verify override.css path is correct
3. Ensure file permissions are set correctly
4. Clear browser cache

### Specificity Issues

Use browser DevTools to:
- Inspect element styles
- Check computed styles
- Identify conflicting rules
- Test selector specificity

### Performance Issues

1. Minimize CSS rule count
2. Avoid complex selectors
3. Use efficient properties
4. Test with large datasets

## Best Practices Summary

1. **Always use override.css** for customizations
2. **Test thoroughly** in both themes and browsers
3. **Document changes** with clear comments
4. **Use CSS variables** when possible
5. **Keep it simple** - avoid over-engineering
6. **Version control** your customizations
7. **Backup before major changes**
8. **Test incrementally** - add changes gradually
9. **Consider accessibility** - maintain contrast ratios
10. **Preserve functionality** - don't break features

## Example Customizations

### Professional Blue Theme

```css
/* Professional blue theme */
.dhx_button--color_primary {
    background-color: #0056b3 !important;
}

.dhx_grid-header {
    background-color: #004085 !important;
    color: white !important;
}

.dhtmlxMenu_dhx_skyblue_TopLevel_Item_Normal {
    background-color: #0056b3 !important;
    color: white !important;
}
```

### Minimalist Theme

```css
/* Minimalist theme */
.dhx_widget {
    border: 1px solid #ddd !important;
    box-shadow: none !important;
}

.dhx_button {
    background-color: #f8f9fa !important;
    border: 1px solid #ddd !important;
}
```

### High Contrast Theme

```css
/* High contrast for accessibility */
.dhx_grid-cell {
    color: #000 !important;
    background-color: #fff !important;
}

.dhx_grid-header {
    background-color: #000 !important;
    color: #fff !important;
}
```

---

**Note**: This guide focuses on safe, maintainable CSS customizations. For JavaScript-level customizations or structural changes, consult the main development team and consider the impact on future updates.