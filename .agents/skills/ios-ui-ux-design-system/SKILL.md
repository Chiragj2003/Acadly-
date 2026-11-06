---
name: ios-ui-ux-design-system
description: "Authoritative design and engineering guidelines for iOS UI/UX development in React Native and Expo. Use when designing, styling, building, or auditing iOS screens, components, color palettes, typography, contrast ratios, safe area insets, navigation, haptics, and modals according to Apple Human Interface Guidelines (HIG) and WCAG AAA accessibility."
metadata:
  author: "acadly"
  version: "1.0.0"
---

# iOS UI/UX Design System & Apple HIG Guidelines

This skill guides the design, layout, contrast, and component engineering for iOS apps built with React Native and Expo, ensuring compliance with Apple's Human Interface Guidelines (HIG) and WCAG AAA accessibility standards.

---

## 1. Color Palette & Contrast Hierarchy (WCAG AAA)

### Core Rule: Zero Low-Contrast Text on Light Surfaces
Never render light grays (`text-slate-400`, `text-slate-300`, `text-gray-400`, `#94A3B8`) on white or light surfaces. In daylight or Retina displays, low-contrast text is unreadable.

| Layer | Hex Token | Tailwind Class | Contrast on White | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Headline / Primary Text** | `#0F172A` | `text-slate-900` | **15.8 : 1** (AAA) | Screen titles, card headers, student names |
| **Body / Core Text** | `#1E293B` | `text-slate-800` | **12.6 : 1** (AAA) | Paragraphs, questions, form values |
| **Secondary / Subtitles** | `#334155` | `text-slate-700` | **9.5 : 1** (AAA) | Captions, card descriptions, roll numbers |
| **Muted Metadata / Badges**| `#475569` | `text-slate-600` | **7.1 : 1** (AAA) | Timestamps, section tags, category labels |
| **Subtle Label / Helper** | `#64748B` | `text-slate-500` | **4.6 : 1** (AA) | Inactive tabs, helper notes |
| **Placeholder Only** | `#94A3B8` | `placeholder:text-slate-400` | N/A | `TextInput` placeholder text only |

### Semantic Status Badges & Chips
Badges must never rely solely on colored text or unbordered pastel fills. Every badge must feature:
1. A subtle, tinted background fill (`50` weight).
2. A matching hairline border (`200` weight).
3. A bold, deep foreground text color (`900` or `800` weight) for guaranteed legibility.

```tsx
// Examples of HIG-compliant Badge Palettes:
Info:     bg-blue-50    border-blue-200/80    text-blue-900 font-bold
Success:  bg-emerald-50 border-emerald-200/80 text-emerald-900 font-bold
Warning:  bg-amber-50   border-amber-200/80   text-amber-900 font-bold
Error:    bg-rose-50    border-rose-200/80    text-rose-900 font-bold
Neutral:  bg-slate-100  border-slate-200/90   text-slate-800 font-semibold
Admin:    bg-slate-900  border-slate-950      text-white font-bold
```

---

## 2. Safe Areas & Layout Geometry

### Safe Area Inset Rules
Always use `useSafeAreaInsets()` from `react-native-safe-area-context` to dynamically protect hardware boundaries:
* **Top (Notch / Dynamic Island)**: Apply `paddingTop: insets.top` on the root status bar container. Ensure the header background extends into the top safe area so there are no awkward color cuts.
* **Bottom (Home Indicator)**: For bottom tabs or sticky action bars, add `paddingBottom: insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 14 : 10)`.
* **Keyboard Offset**: On iOS, apply `keyboardVerticalOffset={Platform.OS === 'ios' ? 56 + insets.top : 0}` to prevent keyboards from pushing input fields behind headers or toolbars.

### Touch Targets
Apple HIG mandates a minimum interactive touch target size of **44 × 44 pt**:
```tsx
// Use hitSlop to expand touch areas on compact icon buttons:
<TouchableOpacity
  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  activeOpacity={0.7}
  className="w-8 h-8 rounded-full items-center justify-center"
>
  <ChevronRight size={16} color="#475569" />
</TouchableOpacity>
```

---

## 3. iOS Navigation & Tab Bar Standards

* **Height**: 56 pt for content + `insets.bottom` for Home Indicator.
* **Separation**: `borderTopWidth: StyleSheet.hairlineWidth`, `borderTopColor: '#E2E8F0'`.
* **Surface**: Pure `#FFFFFF` background with subtle upward drop shadow (`shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.04`).
* **Active State**: Active icon highlighted with iOS system accent (`#2563EB`) inside a tinted pill (`bg-blue-50`), with bold label text.
* **Inactive State**: Clear slate tint (`#64748B`), semibold label text for crisp rendering on Retina screens.

---

## 4. Modal Architecture & Keyboard Avoidance

When presenting modals on iOS:
1. Use `presentationStyle="pageSheet"` or `presentationStyle="overFullScreen"`.
2. Native `<Modal>` instances create an independent window hierarchy outside top-level screen wrappers.
3. Every modal with form inputs **MUST** embed its own `KeyboardAvoidingView` and `ScrollView`:

```tsx
<Modal visible={isOpen} transparent animationType="slide">
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    className="flex-1 justify-end bg-black/50"
  >
    <View className="bg-white rounded-t-3xl p-6 max-h-[85%] border-t border-slate-200">
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Form Inputs */}
      </ScrollView>
    </View>
  </KeyboardAvoidingView>
</Modal>
```

---

## 5. Input Field Specifications

Inputs must feel tactile, structured, and native:
* **Default State**: `bg-white border border-slate-200 shadow-xs rounded-xl px-3.5 py-3 text-slate-900`.
* **Focus State**: `bg-white border-2 border-blue-600 shadow-xs`.
* **Error State**: `bg-rose-50 border border-rose-300 text-rose-900`.
* **Placeholder Text**: Always `#94A3B8`. Never omit or leave as browser gray.
* **Labels**: `text-sm font-bold text-slate-800 mb-1.5`.
