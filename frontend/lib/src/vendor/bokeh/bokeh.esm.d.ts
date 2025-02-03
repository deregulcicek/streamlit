declare const Bokeh: {
  embed: {
    embed_item: (data: any, chartId: string) => Promise<void>
  }
}

export default Bokeh
