# FFAStrans Webinterface - Quick CSS Reference

## 🎯 Immediate Customization

### File Location
```
C:\dev\ffastrans_webui\alternate-server\css\override.css
```

### 🚨 Quick Start

1. **Open** `override.css` in your editor
2. **Add** your CSS rules
3. **Save** the file
4. **Refresh** your browser

## 🎨 Common Changes

### Change Primary Color
```css
.dhx_button--color_primary {
    background-color: #your-color !important;
}
```

### Hide Elements
```css
.element-to-hide {
    display: none !important;
}
```

### Change Font
```css
body, .dhx_widget {
    font-family: 'Your Font', sans-serif !important;
}
```

### Adjust Grid Styling
```css
.dhx_grid-row {
    background-color: #your-color;
}

.dhx_grid-header {
    background-color: #your-color;
}
```

## 🌓 Dark Mode

The interface automatically switches between:
- **Light**: `dhtmlx.css`
- **Dark**: `dhtmlx_benjamin.css`

Controlled by: `localStorage.global_skin_dark`

## 📱 Key Components

### File Browser
- `.dhx_grid` - Main grid container
- `.dhx_grid-row` - File rows
- `.dhx_grid-header` - Column headers

### Forms
- `.dhxform_label` - Form labels
- `.dhxform_control` - Input controls

### Menus
- `.dhtmlxMenu_dhx_skyblue_TopLevel_Item_Normal` - Menu items

### Windows
- `.dhx_window` - Modal windows
- `.dhx_window-header` - Window headers

## ⚠️ Safety Rules

1. **Only edit** `override.css`
2. **Never modify** core CSS files
3. **Always test** in both light/dark modes
4. **Use !important** sparingly
5. **Keep backups** of working versions

## 🔧 Testing

- **Chrome/Edge**: F12 → Elements tab
- **Firefox**: F12 → Inspector
- **Check**: Console for errors
- **Verify**: All features still work

## 📚 Full Guide

See `STYLING_GUIDE.md` for comprehensive documentation.

## 🆘 Troubleshooting

**Styles not applying?**
- Check file path is correct
- Clear browser cache (Ctrl+F5)
- Check browser console for errors

**Dark mode broken?**
- Test styles work with both themes
- Use theme-aware selectors

**Layout issues?**
- Don't override critical layout properties
- Test on different screen sizes

---

**Remember**: override.css loads LAST, so your styles have highest priority!