// axis-tide/src/react/AxisTideText.tsx — React component wrapper
import { forwardRef } from 'react'
import { useAxisTide } from './useAxisTide'
import type { AxisTideOptions } from '../core/types'

interface AxisTideTextProps extends AxisTideOptions {
	children: React.ReactNode
	className?: string
	style?: React.CSSProperties
	as?: keyof JSX.IntrinsicElements
}

/**
 * Drop-in component that applies the axis-tide effect to its children.
 */
export const AxisTideText = forwardRef<HTMLElement, AxisTideTextProps>(
	function AxisTideText({ children, className, style, as: Tag = 'p', ...options }, _ref) {
		const innerRef = useAxisTide(options)
		return (
			<Tag ref={innerRef as React.Ref<HTMLParagraphElement>} className={className} style={style}>
				{children}
			</Tag>
		)
	},
)

AxisTideText.displayName = 'AxisTideText'
