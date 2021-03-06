'use strict'
import React,{Component,PropTypes} from 'react';
import ReactNative,{
  View,
  StyleSheet,
  ScrollView,
  Image,
  Text,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';

let currentPageIndex = 0;
let timer = -1;
let ScreenWidth = Dimensions.get('window').width;
export default class ImageScrollComponent extends Component {
  constructor() {
    super();
    this.state = {
      pageIndexXAnimated:new Animated.Value(0),
    };
  }

  componentDidMount(){
    this.beginTimer();
  }

  componentWillUnmount(){
    this.endTimer();
  }

  beginTimer(){
    if (!this.props.images.length)return;
    this.endTimer();
    timer = setInterval(() =>{
      let width = this.props.itemWidth;
      currentPageIndex = (currentPageIndex + 1)  >= this.props.images.length ? 0 : currentPageIndex + 1;
      this.refs.scrollView.scrollResponderScrollTo({x:currentPageIndex * width,y:0,animated:true});
      this.animatePageIndicator();
    },5000);
  }

  endTimer(){
    if (timer != -1) clearInterval(timer);
    timer = -1;
  }

  animatePageIndicator(){
    if (!this.props.images.length)return;
    let width = this.props.itemWidth / this.props.images.length;
    let marginLeft = width * currentPageIndex;
    Animated.timing(
      this.state.pageIndexXAnimated,
      {
        toValue:marginLeft,
        duration:200,
      }
    ).start();
  }

  handlerImageUrl(url){
    if (typeof url !== 'string') {
      throw new Error('url must be typeof string');
    }
    if (url.search('http:') === -1) {
      return ('http:' + url);
    }else{
      return url;
    }
  }

  _imageOnPress(index){
    if (!!this.props.imageOnPresss) {
      this.props.imageOnPresss(index);
    }
  }

  renderImagesWithData(data:[]){
    if(!data)return;
    if(timer == -1) this.beginTimer();
    var weakself = this;
    return data.map((item,index) => {
        let imageSource = null;
        if (this.props.isUrl) {
          imageSource = {uri:this.handlerImageUrl(item)};
        }else {
          imageSource = item;
        }
        return (
          <TouchableWithoutFeedback onPress={()=> weakself._imageOnPress(index)} key = {index}>
            <Image
            source = {imageSource}
            resizeMode = 'stretch'
            style={{width:this.props.itemWidth,height:this.props.itemHeight}}>
            {this.renderTitleViewWithIndex(index)}
          </Image>
        </TouchableWithoutFeedback>
      );
    });
  }

  renderTitleViewWithIndex(index){
    if (this.props.images.length == this.props.titles.length
      && this.props.images.length != 0
      && index <= this.props.images.length ) {
      return (<Text style={styles.titleViewStyle}>{'  ' + this.props.titles[index]}</Text>);
    }
    return null;
  }


  render(){
    let width = this.props.itemWidth / this.props.images.length;
    let commonStyle = {width:this.props.itemWidth,height:this.props.itemHeight};
    return(
      <View style={styles.container,commonStyle}>
        <ScrollView
          ref='scrollView'
          style={styles.container,commonStyle}
          horizontal = {true}
          automaticallyAdjustContentInsets={false}
          showsHorizontalScrollIndicator = {false}
          showsVerticalScrollIndicator = {false}
          pagingEnabled = {true}
          contentContainerStyle={styles.container}
          scrollEventThrottle = {50}
          onScroll = {this.onScroll.bind(this)}
          onScrollBeginDrag = {this.onScrollBeginDrag.bind(this)}
          onScrollEndDrag = {this.onScrollEndDrag.bind(this)}
          >
          {this.renderImagesWithData(this.props.images)}
        </ScrollView>
        <View style={styles.pageIndicator,{backgroundColor:this.props.pageIndicatorBackgrounpColor}}>
          <Animated.View style={{
              marginLeft:this.state.pageIndexXAnimated,
              width:width,height:2,
              backgroundColor:this.props.pageIndicatorTintColor}}>
          </Animated.View>
        </View>
      </View>
    );
  }

  onScrollBeginDrag(){
    this.endTimer();
  }

  onScrollEndDrag(){
    //延时执行的作用是，防止在用户刚放手的时候，还没停止滚动 就开始新的定时，造成计算index错误
    this.endTimer();
    setTimeout(()=>{
      this.beginTimer();
    },2000);
  }

  onScroll(event){
    // console.log('onScroll');
    if (timer != -1) return;
    //为了兼容iOS和安卓不使用onScrollAnimationEnd
    let contentOffsetX = event.nativeEvent.contentOffset.x;
    if(contentOffsetX <= 0 || contentOffsetX >= this.props.itemWidth * this.props.images.length) return;
    let pageIndex = parseInt(contentOffsetX / this.props.itemWidth);
    //因为contentOffset没有精准的停止，如果计算得到的当前页码存在误差
    let interval = pageIndex * this.props.itemWidth - contentOffsetX;
    if (Math.abs(interval) > this.props.itemWidth * 0.5) {
      interval < 0 ? pageIndex++ : pageIndex--;
    }
    // console.log(pageIndex);
    if (pageIndex != currentPageIndex) {
      currentPageIndex = pageIndex;
      this.animatePageIndicator();
    }
  }

  static defaultProps = {
    images:[],
    titles:[],
    itemWidth:ScreenWidth,
    itemHeight:100,
    isUrl:true,
    pageIndicatorTintColor:'#8B60AFFF',
    pageIndicatorBackgrounpColor:'white',
    imageOnPresss:null,
  };

  static propTypes = {
    images:PropTypes.array,
    titles:PropTypes.array,
    //default is true ,images must return [require(...)..] if false
    isUrl:PropTypes.bool,
    imageOnPresss:PropTypes.func,
    itemWidth:PropTypes.number.isRequired,
    itemHeight:PropTypes.number.isRequired,
    pageIndicatorTintColor:PropTypes.string,
    pageIndicatorBackgrounpColor:PropTypes.string,
  };

}

let styles = StyleSheet.create({
  container:{
    flex:1,
  },
  pageIndicator:{
    height:2,
    bottom:0,
    left:0,
    right:0,
    position:'absolute',
  },
  titleViewStyle:{
    height:20,
    backgroundColor:'#00000066',
    textAlign:'left',
    color:'white',
    fontSize:14,
    bottom:0,
    left:0,
    right:0,
    position:'absolute',
  },
});
