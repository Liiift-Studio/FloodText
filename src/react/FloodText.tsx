// floodText/src/react/FloodText.tsx — React component wrapper
import React, { forwardRef } from 'react'
import { useFloodText } from './useFloodText'
import type { FloodTextOptions } from '../core/types'

interface FloodTextProps extends FloodTextOptions {
	children: React.ReactNode
	className?: string
	style?: React.CSSProperties
	as?: React.ElementType
}

/**
 * Drop-in component that applies the flood-text effect to its children.
 */
export const FloodText = forwardRef<HTMLElement, FloodTextProps>(
	function FloodText({ children, className, style, as: Tag = 'p', ...options }, _ref) {
		const innerRef = useFloodText(options)
		return (
			<Tag ref={innerRef as React.Ref<HTMLElement>} className={className} style={style}>
				{children}
			</Tag>
		)
	},
)

FloodText.displayName = 'FloodText'
