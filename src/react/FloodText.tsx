// floodText/src/react/FloodText.tsx — React component wrapper
import React, { forwardRef, useCallback } from 'react'
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
	function FloodText({ children, className, style, as: Tag = 'p', ...options }, forwardedRef) {
		const innerRef = useFloodText(options)

		// Merge the hook's internal ref with the forwarded ref so both are satisfied.
		const mergedRef = useCallback(
			(node: HTMLElement | null) => {
				;(innerRef as React.MutableRefObject<HTMLElement | null>).current = node
				if (typeof forwardedRef === 'function') {
					forwardedRef(node)
				} else if (forwardedRef) {
					forwardedRef.current = node
				}
			},
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[innerRef, forwardedRef],
		)

		return (
			<Tag ref={mergedRef as React.Ref<HTMLElement>} className={className} style={style}>
				{children}
			</Tag>
		)
	},
)

FloodText.displayName = 'FloodText'
