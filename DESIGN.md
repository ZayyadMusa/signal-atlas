# Signal Atlas Design Guide

## What I want to build

I want Signal Atlas to make environmental data easy to understand.

Someone should be able to select a Nigerian location, view its growing conditions and understand what the information means without needing experience in data analysis.

The website should feel calm, useful and connected to agriculture and the environment. It should look like a mixture of a field notebook and a climate atlas, not a generic technology website.

## Who it is for

Signal Atlas is for people who want to understand environmental conditions in Nigeria, including farmers, students, researchers and anyone interested in agriculture.

The information should be simple enough for beginners but still useful to people who already understand environmental data.

## How it should look

- Clean and easy to read.
- Warm and natural rather than cold and futuristic.
- Modern, but not like every other startup website.
- Connected to Nigeria through real locations and environmental information.
- Spacious, but not empty.
- Interesting without distracting people from the data.

The page should not be made from many identical cards. Sections should only have boxes when the box helps organise the information.

## Colours

| Colour | Value | Use |
|---|---|---|
| Paper | `#F4F0E6` | Main background |
| White | `#FFFFFF` | Forms and selected sections |
| Ink | `#1E2822` | Main text |
| Moss | `#355A42` | Main buttons and important elements |
| Rain | `#2F6478` | Rainfall information |
| Ochre | `#B8682A` | Temperature and small highlights |

The colours should have clear purposes. Data should not depend on colour alone because some users may not be able to tell the colours apart.

## Text

I will use **Newsreader** for headings and **IBM Plex Sans** for everything else.

A monospace font may be added later when Signal Atlas displays real measurements, dates and units. I do not need it for the current landing page.

## Layout

The most important information should be easy to find.

The landing page should lead users towards selecting a location. Maps and charts can use more space, while written explanations should remain shorter and easier to read.

The website must work properly on phones, tablets and computers.

## Environmental data

Every data section should clearly show:

- The selected location.
- The period covered.
- The measurement and its unit.
- A simple explanation of what it means.
- Where the data came from.
- Whether any data is missing.

Signal Atlas must not display invented information as real data.

## Images and illustrations

I do not want random stock photographs of farms.

When images are needed, I would rather use original maps, plant drawings, weather symbols and illustrations created specifically for Signal Atlas.

Images should help explain the project instead of being added just to fill space.

## Things to avoid

- Generic purple and blue AI gradients.
- Glass effects and floating 3D shapes.
- Too many rounded cards.
- Huge headings with very little meaning.
- Random animations.
- Emojis used as interface icons.
- Fake statistics or testimonials.
- Complicated technical language.
- Claims that Signal Atlas can predict conditions before that feature exists.
- Phrases such as “unlock insights” or “revolutionise agriculture.”

## Accessibility

The website should:

- Be usable with a keyboard.
- Have clear focus indicators.
- Use colours with enough contrast.
- Have buttons that are easy to press.
- Explain charts using text as well as colour.
- Remain readable on small screens.
- Load properly on slower internet connections.

## First release decisions

The first release will show rainfall and temperature. Sunlight may be added later.

Results will be arranged in this order:

1. Selected location and period.
2. A short explanation of the conditions.
3. Rainfall information.
4. Temperature information.
5. Data source and missing-data notices.

The mobile layout will use one column. Wider screens may place related information side by side when there is enough space.

Thin atlas lines, measurement marks and short field-note labels will give Signal Atlas its visual identity. They should support the content rather than become decoration.

## Current stage

Signal Atlas currently has only the basic HTML structure.

The next goal is to give it a clear visual identity without pretending that the full data system has already been built. This guide can change as I learn more and improve the project.