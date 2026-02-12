import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import './ContextChartModal.css'

// Extend Window interface to include CanvasJS
declare global {
    interface Window {
        CanvasJS: any
    }
}

interface ContextChartModalProps {
    isOpen: boolean
    onClose: () => void
    words: {
        word: string
        boundedContext?: string
    }[]
}

export function ContextChartModal({
    isOpen,
    onClose,
    words,
}: ContextChartModalProps) {
    const chartRef = useRef<HTMLDivElement>(null)
    const [chartInstance, setChartInstance] = useState<any>(null)

    const dataPoints = useMemo(() => {
        const contextCounts: Record<string, number> = {}

        words.forEach((w) => {
            const context = w.boundedContext?.trim() || 'Undefined'
            contextCounts[context] = (contextCounts[context] || 0) + 1
        })

        const colors = [
            '#4D7399',
            '#B32134',
            '#2E4053',
            '#1ABC9C',
            '#F1C40F',
            '#8E44AD',
            '#E67E22',
            '#3498DB',
            '#9B59B6',
            '#34495E',
            '#16A085',
            '#27AE60',
            '#2980B9',
            '#D35400',
            '#C0392B',
        ]

        return Object.entries(contextCounts)
            .map(([context, count], index) => ({
                label: context,
                y: count,
                color: colors[index % colors.length]
            }))
            .sort((a, b) => b.y - a.y)
    }, [words])

    useEffect(() => {
        if (!isOpen || !chartRef.current) return

        const timer = setTimeout(() => {
            if (!window.CanvasJS) {
                console.error('CanvasJS not loaded')
                return
            }

            const chart = new window.CanvasJS.Chart(chartRef.current, {
                animationEnabled: true,
                theme: 'light2',
                title: {
                    text: 'Words Distribution by Bounded Context',
                    fontSize: 20,
                },
                axisX: {
                    title: 'Bounded Context',
                    labelAngle: -45,
                    interval: 1
                },
                axisY: {
                    title: 'Number of Words',
                    includeZero: true,
                    interval: 1
                },
                data: [
                    {
                        type: 'column',
                        dataPoints: dataPoints,
                    },
                ],
            })

            chart.render()
            setChartInstance(chart)
        }, 100)

        return () => {
            clearTimeout(timer)
            if (chartInstance) {
                chartInstance.destroy()
                setChartInstance(null)
            }
        }
    }, [isOpen, dataPoints])

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div
                className="context-chart-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>Bounded Contexts Statistics</h2>
                    <button className="close-btn" onClick={onClose} aria-label="Close modal">
                        ×
                    </button>
                </div>

                <div className="chart-container" ref={chartRef}></div>
            </div>
        </div>
    )
}
